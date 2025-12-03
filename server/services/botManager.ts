import { storage } from "../storage";
import * as binance from "./binance";
import { analyzeIndicators } from "./indicators";
import type { Bot, BotWithStats, InsertBot, InsertTrade, Candle, IndicatorSettings } from "@shared/schema";
import { indicatorSettingsSchema } from "@shared/schema";

const activeIntervals: Map<string, NodeJS.Timeout> = new Map();

type SellReason = "STOP_LOSS" | "TAKE_PROFIT" | "TRAILING_STOP" | "INDICATOR_OVERBOUGHT" | "MANUAL";

function ensureValidIndicatorSettings(indicators: unknown): IndicatorSettings {
  const defaultSettings: IndicatorSettings = {
    rsi: { enabled: true, period: 14, overbought: 70, oversold: 30 },
    macd: { enabled: true, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    bollingerBands: { enabled: true, period: 20, stdDev: 2 },
    ema: { enabled: true, shortPeriod: 12, longPeriod: 26 },
  };

  if (!indicators || typeof indicators !== "object") {
    return defaultSettings;
  }

  const parsed = indicatorSettingsSchema.safeParse(indicators);
  if (parsed.success) {
    return parsed.data;
  }

  const ind = indicators as Partial<IndicatorSettings>;
  return {
    rsi: {
      enabled: ind.rsi?.enabled ?? defaultSettings.rsi.enabled,
      period: ind.rsi?.period ?? defaultSettings.rsi.period,
      overbought: ind.rsi?.overbought ?? defaultSettings.rsi.overbought,
      oversold: ind.rsi?.oversold ?? defaultSettings.rsi.oversold,
    },
    macd: {
      enabled: ind.macd?.enabled ?? defaultSettings.macd.enabled,
      fastPeriod: ind.macd?.fastPeriod ?? defaultSettings.macd.fastPeriod,
      slowPeriod: ind.macd?.slowPeriod ?? defaultSettings.macd.slowPeriod,
      signalPeriod: ind.macd?.signalPeriod ?? defaultSettings.macd.signalPeriod,
    },
    bollingerBands: {
      enabled: ind.bollingerBands?.enabled ?? defaultSettings.bollingerBands.enabled,
      period: ind.bollingerBands?.period ?? defaultSettings.bollingerBands.period,
      stdDev: ind.bollingerBands?.stdDev ?? defaultSettings.bollingerBands.stdDev,
    },
    ema: {
      enabled: ind.ema?.enabled ?? defaultSettings.ema.enabled,
      shortPeriod: ind.ema?.shortPeriod ?? defaultSettings.ema.shortPeriod,
      longPeriod: ind.ema?.longPeriod ?? defaultSettings.ema.longPeriod,
    },
  };
}

const intervalMs: Record<string, number> = {
  "1m": 60 * 1000,
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "30m": 30 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "4h": 4 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
};

function countEnabledIndicators(indicators: IndicatorSettings): number {
  let count = 0;
  if (indicators.rsi.enabled) count++;
  if (indicators.macd.enabled) count++;
  if (indicators.bollingerBands.enabled) count++;
  if (indicators.ema.enabled) count++;
  return count;
}

function getEffectiveMinSignals(bot: Bot, indicators: IndicatorSettings): number {
  const enabledCount = countEnabledIndicators(indicators);
  if (enabledCount === 0) {
    return bot.minSignals;
  }
  return Math.max(1, Math.min(bot.minSignals, enabledCount));
}

function isInCooldown(bot: Bot): boolean {
  if (!bot.lastSellTime || bot.cooldownMinutes <= 0) {
    return false;
  }
  
  const cooldownMs = bot.cooldownMinutes * 60 * 1000;
  const timeSinceLastSell = Date.now() - new Date(bot.lastSellTime).getTime();
  
  return timeSinceLastSell < cooldownMs;
}

function getCooldownRemaining(bot: Bot): number {
  if (!bot.lastSellTime || bot.cooldownMinutes <= 0) {
    return 0;
  }
  
  const cooldownMs = bot.cooldownMinutes * 60 * 1000;
  const timeSinceLastSell = Date.now() - new Date(bot.lastSellTime).getTime();
  const remaining = cooldownMs - timeSinceLastSell;
  
  return Math.max(0, Math.ceil(remaining / 60000));
}

function getSellReasonLabel(reason: SellReason): string {
  const labels: Record<SellReason, string> = {
    "STOP_LOSS": "Stop Loss",
    "TAKE_PROFIT": "Take Profit",
    "TRAILING_STOP": "Trailing Stop",
    "INDICATOR_OVERBOUGHT": "Sobrecompra (Indicadores)",
    "MANUAL": "Manual",
  };
  return labels[reason];
}

export async function createBot(config: InsertBot): Promise<Bot> {
  const bot = await storage.createBot({
    ...config,
    status: "stopped",
  });
  return bot;
}

export async function startBot(botId: string): Promise<Bot> {
  const bot = await storage.getBot(botId);
  if (!bot) {
    throw new Error("Bot não encontrado");
  }

  if (!binance.isConnected()) {
    throw new Error("API Binance não conectada");
  }

  if (activeIntervals.has(botId)) {
    clearInterval(activeIntervals.get(botId)!);
  }

  const interval = setInterval(async () => {
    try {
      await executeBotCycle(botId);
    } catch (error) {
      console.error(`Bot ${botId} cycle error:`, error);
    }
  }, intervalMs[bot.interval] || intervalMs["1h"]);

  activeIntervals.set(botId, interval);

  const updatedBot = await storage.updateBot(botId, { status: "active" });
  
  await storage.addActivity({
    botId,
    botName: bot.name,
    symbol: bot.symbol,
    type: 'start',
    message: 'Robô iniciado',
    buySignals: 0,
    sellSignals: 0,
    indicators: [],
  });
  
  setTimeout(() => executeBotCycle(botId), 1000);
  
  return updatedBot!;
}

export async function pauseBot(botId: string): Promise<Bot> {
  const bot = await storage.getBot(botId);
  
  if (activeIntervals.has(botId)) {
    clearInterval(activeIntervals.get(botId)!);
    activeIntervals.delete(botId);
  }

  const updatedBot = await storage.updateBot(botId, { status: "paused" });
  if (!updatedBot) {
    throw new Error("Bot não encontrado");
  }
  
  if (bot) {
    await storage.addActivity({
      botId,
      botName: bot.name,
      symbol: bot.symbol,
      type: 'stop',
      message: 'Robô pausado',
      buySignals: 0,
      sellSignals: 0,
      indicators: [],
    });
  }
  
  return updatedBot;
}

export async function stopBot(botId: string): Promise<Bot> {
  const bot = await storage.getBot(botId);
  
  if (activeIntervals.has(botId)) {
    clearInterval(activeIntervals.get(botId)!);
    activeIntervals.delete(botId);
  }

  const updatedBot = await storage.updateBot(botId, { 
    status: "stopped",
    lastSignal: null,
    lastSignalTime: null,
  });
  if (!updatedBot) {
    throw new Error("Bot não encontrado");
  }
  
  if (bot) {
    await storage.addActivity({
      botId,
      botName: bot.name,
      symbol: bot.symbol,
      type: 'stop',
      message: 'Robô parado',
      buySignals: 0,
      sellSignals: 0,
      indicators: [],
    });
  }
  
  return updatedBot;
}

export async function deleteBot(botId: string): Promise<void> {
  if (activeIntervals.has(botId)) {
    clearInterval(activeIntervals.get(botId)!);
    activeIntervals.delete(botId);
  }
  
  await storage.deleteBot(botId);
}

async function executeBotCycle(botId: string): Promise<void> {
  const bot = await storage.getBot(botId);
  if (!bot || bot.status !== "active") {
    return;
  }

  console.log(`[Bot ${bot.name}] Executing cycle for ${bot.symbol}`);

  try {
    const currentPrice = await binance.getPrice(bot.symbol);
    const symbolInfo = await binance.getSymbolMinQuantity(bot.symbol);
    const openPosition = await storage.getOpenPosition(botId);
    const hasPosition = openPosition && bot.currentBalance > 0;
    
    console.log(`[Bot ${bot.name}] Preço atual: $${currentPrice.toFixed(4)}, Posição: ${hasPosition ? `SIM (${bot.currentBalance} @ $${bot.avgEntryPrice})` : 'NÃO'}`);

    if (hasPosition) {
      const sellResult = await checkSellConditions(bot, currentPrice, symbolInfo);
      if (sellResult.shouldSell) {
        await executeSell(botId, bot, currentPrice, symbolInfo, sellResult.reason, sellResult.indicators || []);
        return;
      }
      
      await checkDCAOpportunity(botId, bot, currentPrice, symbolInfo);
      return;
    }

    if (isInCooldown(bot)) {
      const remaining = getCooldownRemaining(bot);
      console.log(`[Bot ${bot.name}] Em cooldown, ${remaining} min restantes`);
      await storage.addActivity({
        botId,
        botName: bot.name,
        symbol: bot.symbol,
        type: 'analysis',
        message: `Aguardando cooldown (${remaining} min restantes após ${getSellReasonLabel(bot.lastSellReason as SellReason || "MANUAL")})`,
        buySignals: 0,
        sellSignals: 0,
        indicators: [],
      });
      return;
    }

    await checkBuyConditions(botId, bot, currentPrice, symbolInfo);

  } catch (error: any) {
    console.error(`[Bot ${bot.name}] Cycle error:`, error.message);
    
    await storage.addActivity({
      botId,
      botName: bot.name,
      symbol: bot.symbol,
      type: 'error',
      message: `Erro no ciclo: ${error.message}`,
      buySignals: 0,
      sellSignals: 0,
      indicators: [],
    });
    
    await storage.updateBot(botId, { status: "error" });
  }
}

interface SellCheckResult {
  shouldSell: boolean;
  reason: SellReason;
  indicators?: string[];
}

async function checkSellConditions(bot: Bot, currentPrice: number, symbolInfo: any): Promise<SellCheckResult> {
  const avgEntryPrice = bot.avgEntryPrice || 0;
  if (avgEntryPrice <= 0) {
    return { shouldSell: false, reason: "MANUAL" };
  }

  const pnlPercent = ((currentPrice - avgEntryPrice) / avgEntryPrice) * 100;
  
  console.log(`[Bot ${bot.name}] Verificando condições de venda:`);
  console.log(`  - Preço entrada: $${avgEntryPrice.toFixed(4)}`);
  console.log(`  - Preço atual: $${currentPrice.toFixed(4)}`);
  console.log(`  - P&L: ${pnlPercent.toFixed(2)}%`);
  console.log(`  - Stop Loss: ${bot.stopLoss}%, Take Profit: ${bot.takeProfit}%`);
  
  if (bot.stopLoss > 0 && pnlPercent <= -bot.stopLoss) {
    console.log(`[Bot ${bot.name}] ❌ STOP LOSS acionado! P&L ${pnlPercent.toFixed(2)}% <= -${bot.stopLoss}%`);
    return { shouldSell: true, reason: "STOP_LOSS" };
  }

  if (bot.takeProfit > 0 && pnlPercent >= bot.takeProfit) {
    console.log(`[Bot ${bot.name}] ✅ TAKE PROFIT acionado! P&L ${pnlPercent.toFixed(2)}% >= ${bot.takeProfit}%`);
    return { shouldSell: true, reason: "TAKE_PROFIT" };
  }

  if (bot.trailingStopPercent > 0 && pnlPercent > 0) {
    let highestPrice = bot.highestPrice || avgEntryPrice;
    
    if (currentPrice > highestPrice) {
      highestPrice = currentPrice;
      const newTrailingStopPrice = currentPrice * (1 - bot.trailingStopPercent / 100);
      
      await storage.updateBot(bot.id, {
        highestPrice: currentPrice,
        trailingStopPrice: newTrailingStopPrice,
      });
      
      console.log(`[Bot ${bot.name}] 📈 Novo máximo: $${currentPrice.toFixed(4)}, Trailing Stop atualizado para $${newTrailingStopPrice.toFixed(4)}`);
    } else if (bot.trailingStopPrice && currentPrice <= bot.trailingStopPrice) {
      console.log(`[Bot ${bot.name}] 🔻 TRAILING STOP acionado! Preço $${currentPrice.toFixed(4)} <= Trailing $${bot.trailingStopPrice.toFixed(4)}`);
      return { shouldSell: true, reason: "TRAILING_STOP" };
    }
  }

  const candles = await binance.getCandles(bot.symbol, bot.interval, 100);
  if (candles.length < 30) {
    console.log(`[Bot ${bot.name}] Dados insuficientes para análise de indicadores`);
    return { shouldSell: false, reason: "MANUAL" };
  }

  const indicators = ensureValidIndicatorSettings(bot.indicators);
  const analysis = analyzeIndicators(candles, indicators);
  const effectiveMinSignals = getEffectiveMinSignals(bot, indicators);
  
  console.log(`[Bot ${bot.name}] Indicadores: sellCount=${analysis.sellCount}, minSignals=${effectiveMinSignals}`);
  
  const activeIndicatorDetails = analysis.signals.map(s => {
    const valueStr = typeof s.value === 'number' ? s.value.toFixed(2) : s.value;
    return `${s.name}=${valueStr} (${s.signal})`;
  });

  await storage.updateBot(bot.id, {
    lastSignal: analysis.overallSignal,
    lastSignalTime: new Date(),
  });

  await storage.addActivity({
    botId: bot.id,
    botName: bot.name,
    symbol: bot.symbol,
    type: 'analysis',
    message: `Monitorando posição: P&L ${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}% | SL: -${bot.stopLoss}% | TP: +${bot.takeProfit}%`,
    buySignals: analysis.buyCount,
    sellSignals: analysis.sellCount,
    indicators: activeIndicatorDetails,
  });

  if (analysis.overallSignal === "sell" && analysis.sellCount >= effectiveMinSignals) {
    console.log(`[Bot ${bot.name}] 📉 SOBRECOMPRA detectada! ${analysis.sellCount} sinais de venda`);
    const sellIndicators = analysis.signals
      .filter(s => s.signal === "sell")
      .map(s => s.name);
    return { shouldSell: true, reason: "INDICATOR_OVERBOUGHT", indicators: sellIndicators };
  }

  return { shouldSell: false, reason: "MANUAL" };
}

async function executeSell(
  botId: string, 
  bot: Bot, 
  currentPrice: number, 
  symbolInfo: any, 
  reason: SellReason,
  indicatorNames: string[]
): Promise<void> {
  const quantity = binance.formatQuantity(bot.currentBalance, symbolInfo.stepSize);
  const avgEntryPrice = bot.avgEntryPrice || 0;
  
  console.log(`[Bot ${bot.name}] Executando VENDA: ${quantity} @ $${currentPrice.toFixed(4)} | Motivo: ${getSellReasonLabel(reason)}`);
  
  try {
    const order = await binance.placeMarketOrder(bot.symbol, "SELL", quantity);
    
    const pnl = (currentPrice - avgEntryPrice) * quantity;
    const pnlPercent = avgEntryPrice > 0 ? ((currentPrice - avgEntryPrice) / avgEntryPrice) * 100 : 0;
    
    const tradeIndicators = reason === "INDICATOR_OVERBOUGHT" ? indicatorNames : [reason];
    
    const trade: InsertTrade = {
      botId,
      symbol: bot.symbol,
      side: "sell",
      type: "MARKET",
      price: currentPrice,
      amount: quantity,
      total: quantity * currentPrice,
      pnl,
      pnlPercent,
      indicators: tradeIndicators,
      binanceOrderId: order.orderId?.toString(),
      status: "completed",
    };
    
    await storage.createTrade(trade);
    
    const isWinning = pnl > 0;
    await storage.updateBot(botId, {
      totalTrades: bot.totalTrades + 1,
      winningTrades: isWinning ? bot.winningTrades + 1 : bot.winningTrades,
      totalPnl: bot.totalPnl + pnl,
      currentBalance: 0,
      investedAmount: 0,
      avgEntryPrice: 0,
      highestPrice: null,
      trailingStopPrice: null,
      lastSellTime: new Date(),
      lastSellReason: reason,
    });
    
    const pnlSign = pnl >= 0 ? '+' : '';
    const reasonLabel = getSellReasonLabel(reason);
    
    await storage.addActivity({
      botId,
      botName: bot.name,
      symbol: bot.symbol,
      type: 'sell',
      message: `VENDA executada (${reasonLabel}): ${quantity} @ $${currentPrice.toFixed(4)} | P&L: ${pnlSign}$${pnl.toFixed(2)} (${pnlSign}${pnlPercent.toFixed(2)}%)`,
      buySignals: 0,
      sellSignals: 1,
      indicators: tradeIndicators,
    });
    
    console.log(`[Bot ${bot.name}] ✅ VENDA executada: Order ${order.orderId}, P&L: ${pnlSign}$${pnl.toFixed(2)} (${reasonLabel})`);
    
  } catch (error: any) {
    console.error(`[Bot ${bot.name}] ❌ Erro na VENDA:`, error.message);
    await storage.addActivity({
      botId,
      botName: bot.name,
      symbol: bot.symbol,
      type: 'error',
      message: `Erro na VENDA (${getSellReasonLabel(reason)}): ${error.message}`,
      buySignals: 0,
      sellSignals: 0,
      indicators: [],
    });
  }
}

async function checkDCAOpportunity(botId: string, bot: Bot, currentPrice: number, symbolInfo: any): Promise<void> {
  const investedAmount = bot.investedAmount || 0;
  const targetInvestment = bot.investment;
  
  if (investedAmount >= targetInvestment) {
    return;
  }
  
  const remainingToInvest = targetInvestment - investedAmount;
  
  if (remainingToInvest < symbolInfo.minNotional) {
    return;
  }
  
  console.log(`[Bot ${bot.name}] DCA: Investimento atual $${investedAmount.toFixed(2)}, Alvo $${targetInvestment.toFixed(2)}, Restante $${remainingToInvest.toFixed(2)}`);
  
  const candles = await binance.getCandles(bot.symbol, bot.interval, 100);
  if (candles.length < 30) {
    return;
  }
  
  const indicators = ensureValidIndicatorSettings(bot.indicators);
  const analysis = analyzeIndicators(candles, indicators);
  const effectiveMinSignals = getEffectiveMinSignals(bot, indicators);
  
  if (analysis.overallSignal !== "buy" || analysis.buyCount < effectiveMinSignals) {
    console.log(`[Bot ${bot.name}] DCA: Aguardando sinal de compra (${analysis.buyCount}/${effectiveMinSignals})`);
    return;
  }
  
  const availableBalance = await binance.getAssetBalance("USDT");
  
  if (availableBalance < symbolInfo.minNotional) {
    console.log(`[Bot ${bot.name}] DCA: Saldo USDT insuficiente ($${availableBalance.toFixed(2)})`);
    await storage.addActivity({
      botId,
      botName: bot.name,
      symbol: bot.symbol,
      type: 'analysis',
      message: `DCA: Saldo USDT insuficiente ($${availableBalance.toFixed(2)}) para investir mais`,
      buySignals: analysis.buyCount,
      sellSignals: analysis.sellCount,
      indicators: [],
    });
    return;
  }
  
  const investAmount = Math.min(remainingToInvest, availableBalance);
  
  if (investAmount < symbolInfo.minNotional) {
    return;
  }
  
  let quantity = investAmount / currentPrice;
  quantity = binance.formatQuantity(quantity, symbolInfo.stepSize);
  
  console.log(`[Bot ${bot.name}] DCA: Comprando mais ${quantity} @ $${currentPrice.toFixed(4)} ($${investAmount.toFixed(2)})`);
  
  try {
    const order = await binance.placeMarketOrder(bot.symbol, "BUY", quantity);
    
    const oldBalance = bot.currentBalance || 0;
    const oldInvested = bot.investedAmount || 0;
    const oldAvgPrice = bot.avgEntryPrice || 0;
    
    const newBalance = oldBalance + quantity;
    const newInvested = oldInvested + investAmount;
    const newAvgPrice = (oldAvgPrice * oldBalance + currentPrice * quantity) / newBalance;
    
    const trade: InsertTrade = {
      botId,
      symbol: bot.symbol,
      side: "buy",
      type: "MARKET",
      price: currentPrice,
      amount: quantity,
      total: investAmount,
      indicators: analysis.signals.filter(s => s.signal === "buy").map(s => s.name),
      binanceOrderId: order.orderId?.toString(),
      status: "completed",
    };
    
    await storage.createTrade(trade);
    await storage.updateBot(botId, {
      totalTrades: bot.totalTrades + 1,
      currentBalance: newBalance,
      investedAmount: newInvested,
      avgEntryPrice: newAvgPrice,
    });
    
    await storage.addActivity({
      botId,
      botName: bot.name,
      symbol: bot.symbol,
      type: 'buy',
      message: `DCA: COMPRA adicional ${quantity} @ $${currentPrice.toFixed(4)} = $${investAmount.toFixed(2)} | Total investido: $${newInvested.toFixed(2)} | Novo preço médio: $${newAvgPrice.toFixed(4)}`,
      buySignals: analysis.buyCount,
      sellSignals: analysis.sellCount,
      indicators: analysis.signals.filter(s => s.signal === "buy").map(s => s.name),
    });
    
    console.log(`[Bot ${bot.name}] ✅ DCA executado: Order ${order.orderId}, Novo preço médio: $${newAvgPrice.toFixed(4)}`);
    
  } catch (error: any) {
    console.error(`[Bot ${bot.name}] ❌ Erro no DCA:`, error.message);
    await storage.addActivity({
      botId,
      botName: bot.name,
      symbol: bot.symbol,
      type: 'error',
      message: `Erro no DCA: ${error.message}`,
      buySignals: analysis.buyCount,
      sellSignals: analysis.sellCount,
      indicators: [],
    });
  }
}

async function checkBuyConditions(botId: string, bot: Bot, currentPrice: number, symbolInfo: any): Promise<void> {
  const candles = await binance.getCandles(bot.symbol, bot.interval, 100);
  
  if (candles.length < 30) {
    console.log(`[Bot ${bot.name}] Dados insuficientes para análise`);
    await storage.addActivity({
      botId,
      botName: bot.name,
      symbol: bot.symbol,
      type: 'error',
      message: 'Dados insuficientes para análise',
      buySignals: 0,
      sellSignals: 0,
      indicators: [],
    });
    return;
  }

  const indicators = ensureValidIndicatorSettings(bot.indicators);
  const analysis = analyzeIndicators(candles, indicators);
  const effectiveMinSignals = getEffectiveMinSignals(bot, indicators);
  const enabledCount = countEnabledIndicators(indicators);
  
  console.log(`[Bot ${bot.name}] Análise: ${analysis.overallSignal}, buyCount=${analysis.buyCount}, minSignals=${effectiveMinSignals}`);
  
  const activeIndicatorDetails = analysis.signals.map(s => {
    const valueStr = typeof s.value === 'number' ? s.value.toFixed(2) : s.value;
    return `${s.name}=${valueStr} (${s.signal})`;
  });
  
  const signalDetails = analysis.signals
    .filter(s => s.signal !== 'neutral')
    .map(s => `${s.name}: ${s.description}`)
    .join('; ');
  
  const minSignalsInfo = effectiveMinSignals !== bot.minSignals 
    ? `${effectiveMinSignals} necessários (ajustado de ${bot.minSignals} para ${enabledCount} indicadores ativos)`
    : `${effectiveMinSignals} necessários`;
  
  await storage.addActivity({
    botId,
    botName: bot.name,
    symbol: bot.symbol,
    type: 'analysis',
    message: analysis.overallSignal === 'hold' 
      ? `Aguardando sinais (${minSignalsInfo}). ${signalDetails || 'Nenhum sinal ativo'}`
      : `Sinal detectado: ${analysis.overallSignal.toUpperCase()} - ${signalDetails}`,
    buySignals: analysis.buyCount,
    sellSignals: analysis.sellCount,
    indicators: activeIndicatorDetails,
  });

  await storage.updateBot(botId, {
    lastSignal: analysis.overallSignal,
    lastSignalTime: new Date(),
  });

  if (analysis.overallSignal !== "buy" || analysis.buyCount < effectiveMinSignals) {
    console.log(`[Bot ${bot.name}] Aguardando sinal de compra...`);
    return;
  }

  const investmentAmount = bot.investment;
  let quantity = investmentAmount / currentPrice;
  
  if (quantity * currentPrice < symbolInfo.minNotional) {
    console.log(`[Bot ${bot.name}] Ordem muito pequena (min notional: ${symbolInfo.minNotional})`);
    return;
  }
  
  quantity = binance.formatQuantity(quantity, symbolInfo.stepSize);
  
  const availableBalance = await binance.getAssetBalance("USDT");
  
  if (availableBalance < investmentAmount) {
    console.log(`[Bot ${bot.name}] Saldo USDT insuficiente: $${availableBalance.toFixed(2)} < $${investmentAmount.toFixed(2)}`);
    
    if (availableBalance >= symbolInfo.minNotional) {
      quantity = binance.formatQuantity(availableBalance / currentPrice, symbolInfo.stepSize);
      console.log(`[Bot ${bot.name}] Usando saldo disponível: ${quantity} @ $${currentPrice.toFixed(4)}`);
    } else {
      await storage.addActivity({
        botId,
        botName: bot.name,
        symbol: bot.symbol,
        type: 'error',
        message: `Saldo USDT insuficiente: $${availableBalance.toFixed(2)} (mínimo: $${symbolInfo.minNotional.toFixed(2)})`,
        buySignals: analysis.buyCount,
        sellSignals: analysis.sellCount,
        indicators: activeIndicatorDetails,
      });
      return;
    }
  }
  
  console.log(`[Bot ${bot.name}] Executando COMPRA: ${quantity} @ $${currentPrice.toFixed(4)}`);
  
  try {
    const order = await binance.placeMarketOrder(bot.symbol, "BUY", quantity);
    const totalInvested = quantity * currentPrice;
    
    const trade: InsertTrade = {
      botId,
      symbol: bot.symbol,
      side: "buy",
      type: "MARKET",
      price: currentPrice,
      amount: quantity,
      total: totalInvested,
      indicators: analysis.signals.filter(s => s.signal === "buy").map(s => s.name),
      binanceOrderId: order.orderId?.toString(),
      status: "completed",
    };
    
    await storage.createTrade(trade);
    await storage.updateBot(botId, {
      totalTrades: bot.totalTrades + 1,
      currentBalance: quantity,
      investedAmount: totalInvested,
      avgEntryPrice: currentPrice,
      highestPrice: currentPrice,
      trailingStopPrice: bot.trailingStopPercent > 0 ? currentPrice * (1 - bot.trailingStopPercent / 100) : null,
    });
    
    await storage.addActivity({
      botId,
      botName: bot.name,
      symbol: bot.symbol,
      type: 'buy',
      message: `COMPRA executada: ${quantity} @ $${currentPrice.toFixed(4)} = $${totalInvested.toFixed(2)}`,
      buySignals: analysis.buyCount,
      sellSignals: analysis.sellCount,
      indicators: activeIndicatorDetails,
    });
    
    console.log(`[Bot ${bot.name}] ✅ COMPRA executada: Order ${order.orderId}`);
    
  } catch (error: any) {
    console.error(`[Bot ${bot.name}] ❌ Erro na COMPRA:`, error.message);
    await storage.addActivity({
      botId,
      botName: bot.name,
      symbol: bot.symbol,
      type: 'error',
      message: `Erro na COMPRA: ${error.message}`,
      buySignals: analysis.buyCount,
      sellSignals: analysis.sellCount,
      indicators: activeIndicatorDetails,
    });
  }
}

export async function getBotWithStats(botId: string): Promise<BotWithStats | null> {
  const bot = await storage.getBot(botId);
  if (!bot) return null;

  const indicators = ensureValidIndicatorSettings(bot.indicators);
  const activeIndicators: string[] = [];
  if (indicators.rsi.enabled) activeIndicators.push("RSI");
  if (indicators.macd.enabled) activeIndicators.push("MACD");
  if (indicators.bollingerBands.enabled) activeIndicators.push("Bollinger");
  if (indicators.ema.enabled) activeIndicators.push("EMA");

  const trades = await storage.getAllTrades(botId);
  const sellTrades = trades.filter(t => t.side === "sell" && t.status === "completed");
  
  let totalPnlFromTrades = 0;
  let totalPnlPercentSum = 0;
  
  for (const trade of sellTrades) {
    if (trade.pnl !== null && trade.pnl !== undefined) {
      totalPnlFromTrades += trade.pnl;
    }
    if (trade.pnlPercent !== null && trade.pnlPercent !== undefined) {
      totalPnlPercentSum += trade.pnlPercent;
    }
  }
  
  const realPnl = sellTrades.length > 0 ? totalPnlFromTrades : bot.totalPnl;
  const avgPnlPercent = sellTrades.length > 0 ? totalPnlPercentSum / sellTrades.length : 0;
  const pnlPercent = bot.investment > 0 ? (realPnl / bot.investment) * 100 : 0;
  const winRate = bot.totalTrades > 0 ? (bot.winningTrades / bot.totalTrades) * 100 : 0;
  const avgProfit = avgPnlPercent;

  return {
    ...bot,
    totalPnl: realPnl,
    pnlPercent,
    winRate,
    avgProfit,
    activeIndicators,
  };
}

export async function getAllBotsWithStats(): Promise<BotWithStats[]> {
  const bots = await storage.getAllBots();
  return Promise.all(
    bots.map(async (bot) => {
      const stats = await getBotWithStats(bot.id);
      return stats!;
    })
  );
}

export async function analyzeSymbol(symbol: string, indicators: IndicatorSettings, interval: string = "1h") {
  if (!binance.isConnected()) {
    throw new Error("API Binance não conectada");
  }

  const candles = await binance.getCandles(symbol, interval, 100);
  return analyzeIndicators(candles, indicators);
}
