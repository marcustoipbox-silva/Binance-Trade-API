import { storage } from "../storage";
import * as binance from "./binance";
import { analyzeIndicators } from "./indicators";
import type { Bot, BotWithStats, InsertBot, InsertTrade, Candle, IndicatorSettings } from "@shared/schema";
import { indicatorSettingsSchema } from "@shared/schema";

const activeIntervals: Map<string, NodeJS.Timeout> = new Map();

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
    const candles = await binance.getCandles(bot.symbol, bot.interval, 100);
    
    if (candles.length < 30) {
      console.log(`[Bot ${bot.name}] Not enough candle data`);
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
    console.log(`[Bot ${bot.name}] Indicadores salvos no bot:`, JSON.stringify(bot.indicators));
    console.log(`[Bot ${bot.name}] Indicadores após validação:`, JSON.stringify(indicators));
    const analysis = analyzeIndicators(candles, indicators);
    
    const effectiveMinSignals = getEffectiveMinSignals(bot, indicators);
    const enabledCount = countEnabledIndicators(indicators);
    
    console.log(`[Bot ${bot.name}] Analysis result: overallSignal=${analysis.overallSignal}, buyCount=${analysis.buyCount}, sellCount=${analysis.sellCount}`);
    console.log(`[Bot ${bot.name}] Indicators: ${enabledCount} ativos, minSignals configurado=${bot.minSignals}, efetivo=${effectiveMinSignals}`);
    console.log(`[Bot ${bot.name}] Signals:`, analysis.signals.map(s => `${s.name}=${s.value?.toFixed?.(2) || s.value}(${s.signal})`).join(', '));

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

    const signalMap: Record<string, string> = {
      buy: "buy",
      sell: "sell",
      hold: "hold",
    };

    await storage.updateBot(botId, {
      lastSignal: signalMap[analysis.overallSignal],
      lastSignalTime: new Date(),
    });

    const shouldTrade = 
      (analysis.overallSignal === "buy" && analysis.buyCount >= effectiveMinSignals) ||
      (analysis.overallSignal === "sell" && analysis.sellCount >= effectiveMinSignals);

    console.log(`[Bot ${bot.name}] shouldTrade=${shouldTrade}`);
    console.log(`[Bot ${bot.name}] - BUY: ${analysis.buyCount} sinais >= ${effectiveMinSignals}? ${analysis.buyCount >= effectiveMinSignals}`);
    console.log(`[Bot ${bot.name}] - SELL: ${analysis.sellCount} sinais >= ${effectiveMinSignals}? ${analysis.sellCount >= effectiveMinSignals}`);

    if (!shouldTrade) {
      console.log(`[Bot ${bot.name}] Waiting for trade signal...`);
      return;
    }

    const currentPrice = await binance.getPrice(bot.symbol);
    const symbolInfo = await binance.getSymbolMinQuantity(bot.symbol);
    
    const openPosition = await storage.getOpenPosition(botId);
    
    console.log(`[Bot ${bot.name}] openPosition=${openPosition ? `SIM (compra @ ${openPosition.price})` : 'NÃO'}, currentBalance=${bot.currentBalance}`);

    if (analysis.overallSignal === "buy") {
      if (openPosition) {
        console.log(`[Bot ${bot.name}] BUY signal mas JÁ tem posição aberta @ ${openPosition.price}`);
        await storage.addActivity({
          botId,
          botName: bot.name,
          symbol: bot.symbol,
          type: 'analysis',
          message: `Sinal de COMPRA detectado, mas já existe posição aberta @ $${openPosition.price.toFixed(4)}`,
          buySignals: analysis.buyCount,
          sellSignals: analysis.sellCount,
          indicators: activeIndicatorDetails,
        });
        return;
      }
      
      const investmentAmount = bot.investment;
      let quantity = investmentAmount / currentPrice;
      
      if (quantity * currentPrice < symbolInfo.minNotional) {
        console.log(`[Bot ${bot.name}] Order too small (min notional: ${symbolInfo.minNotional})`);
        return;
      }
      
      quantity = binance.formatQuantity(quantity, symbolInfo.stepSize);
      
      console.log(`[Bot ${bot.name}] Placing BUY order: ${quantity} @ ${currentPrice}`);
      
      try {
        const order = await binance.placeMarketOrder(bot.symbol, "BUY", quantity);
        
        const trade: InsertTrade = {
          botId,
          symbol: bot.symbol,
          side: "buy",
          type: "MARKET",
          price: currentPrice,
          amount: quantity,
          total: quantity * currentPrice,
          indicators: analysis.signals
            .filter(s => s.signal === "buy")
            .map(s => s.name),
          binanceOrderId: order.orderId?.toString(),
          status: "completed",
        };
        
        await storage.createTrade(trade);
        await storage.updateBot(botId, {
          totalTrades: bot.totalTrades + 1,
          currentBalance: quantity,
        });
        
        await storage.addActivity({
          botId,
          botName: bot.name,
          symbol: bot.symbol,
          type: 'buy',
          message: `COMPRA executada: ${quantity} @ $${currentPrice.toFixed(4)} = $${(quantity * currentPrice).toFixed(2)}`,
          buySignals: analysis.buyCount,
          sellSignals: analysis.sellCount,
          indicators: activeIndicatorDetails,
        });
        
        console.log(`[Bot ${bot.name}] BUY order executed: ${order.orderId}`);
      } catch (error: any) {
        console.error(`[Bot ${bot.name}] BUY order failed:`, error.message);
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
      
    } else if (analysis.overallSignal === "sell") {
      if (!openPosition) {
        console.log(`[Bot ${bot.name}] SELL signal mas SEM posição aberta - nada a vender`);
        await storage.addActivity({
          botId,
          botName: bot.name,
          symbol: bot.symbol,
          type: 'analysis',
          message: 'Sinal de VENDA detectado, mas não há posição aberta para vender',
          buySignals: analysis.buyCount,
          sellSignals: analysis.sellCount,
          indicators: activeIndicatorDetails,
        });
        return;
      }
      
      const quantity = bot.currentBalance;
      
      if (quantity <= 0) {
        console.log(`[Bot ${bot.name}] currentBalance=0, nada a vender`);
        return;
      }
      
      const formattedQty = binance.formatQuantity(quantity, symbolInfo.stepSize);
      
      console.log(`[Bot ${bot.name}] Placing SELL order: ${formattedQty} @ ${currentPrice}`);
      
      try {
        const order = await binance.placeMarketOrder(bot.symbol, "SELL", formattedQty);
        
        const entryPrice = openPosition.price;
        const pnl = (currentPrice - entryPrice) * formattedQty;
        const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
        
        const trade: InsertTrade = {
          botId,
          symbol: bot.symbol,
          side: "sell",
          type: "MARKET",
          price: currentPrice,
          amount: formattedQty,
          total: formattedQty * currentPrice,
          pnl,
          pnlPercent,
          indicators: analysis.signals
            .filter(s => s.signal === "sell")
            .map(s => s.name),
          binanceOrderId: order.orderId?.toString(),
          status: "completed",
        };
        
        await storage.createTrade(trade);
        
        const newWinningTrades = pnl > 0 ? bot.winningTrades + 1 : bot.winningTrades;
        await storage.updateBot(botId, {
          totalTrades: bot.totalTrades + 1,
          winningTrades: newWinningTrades,
          totalPnl: bot.totalPnl + pnl,
          currentBalance: 0,
        });
        
        const pnlSign = pnl >= 0 ? '+' : '';
        await storage.addActivity({
          botId,
          botName: bot.name,
          symbol: bot.symbol,
          type: 'sell',
          message: `VENDA executada: ${formattedQty} @ $${currentPrice.toFixed(4)} | P&L: ${pnlSign}$${pnl.toFixed(2)} (${pnlSign}${pnlPercent.toFixed(2)}%)`,
          buySignals: analysis.buyCount,
          sellSignals: analysis.sellCount,
          indicators: activeIndicatorDetails,
        });
        
        console.log(`[Bot ${bot.name}] SELL order executed: ${order.orderId}, PnL: ${pnl.toFixed(2)}`);
      } catch (error: any) {
        console.error(`[Bot ${bot.name}] SELL order failed:`, error.message);
        await storage.addActivity({
          botId,
          botName: bot.name,
          symbol: bot.symbol,
          type: 'error',
          message: `Erro na VENDA: ${error.message}`,
          buySignals: analysis.buyCount,
          sellSignals: analysis.sellCount,
          indicators: activeIndicatorDetails,
        });
      }
    }

    if (openPosition && bot.currentBalance > 0) {
      const entryPrice = openPosition.price;
      const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
      
      if (bot.stopLoss > 0 && pnlPercent <= -bot.stopLoss) {
        console.log(`[Bot ${bot.name}] Stop loss triggered at ${pnlPercent.toFixed(2)}%`);
        await executeStopLoss(botId, bot, currentPrice, entryPrice);
      } else if (bot.takeProfit > 0 && pnlPercent >= bot.takeProfit) {
        console.log(`[Bot ${bot.name}] Take profit triggered at ${pnlPercent.toFixed(2)}%`);
        await executeTakeProfit(botId, bot, currentPrice, entryPrice);
      }
    }

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

async function executeStopLoss(botId: string, bot: Bot, currentPrice: number, entryPrice: number): Promise<void> {
  const symbolInfo = await binance.getSymbolMinQuantity(bot.symbol);
  const quantity = binance.formatQuantity(bot.currentBalance, symbolInfo.stepSize);
  
  try {
    const order = await binance.placeMarketOrder(bot.symbol, "SELL", quantity);
    
    const pnl = (currentPrice - entryPrice) * quantity;
    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    
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
      indicators: ["STOP_LOSS"],
      binanceOrderId: order.orderId?.toString(),
      status: "completed",
    };
    
    await storage.createTrade(trade);
    await storage.updateBot(botId, {
      totalTrades: bot.totalTrades + 1,
      totalPnl: bot.totalPnl + pnl,
      currentBalance: 0,
    });
    
    console.log(`[Bot ${bot.name}] Stop loss executed, PnL: ${pnl.toFixed(2)}`);
  } catch (error: any) {
    console.error(`[Bot ${bot.name}] Stop loss failed:`, error.message);
  }
}

async function executeTakeProfit(botId: string, bot: Bot, currentPrice: number, entryPrice: number): Promise<void> {
  const symbolInfo = await binance.getSymbolMinQuantity(bot.symbol);
  const quantity = binance.formatQuantity(bot.currentBalance, symbolInfo.stepSize);
  
  try {
    const order = await binance.placeMarketOrder(bot.symbol, "SELL", quantity);
    
    const pnl = (currentPrice - entryPrice) * quantity;
    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    
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
      indicators: ["TAKE_PROFIT"],
      binanceOrderId: order.orderId?.toString(),
      status: "completed",
    };
    
    await storage.createTrade(trade);
    await storage.updateBot(botId, {
      totalTrades: bot.totalTrades + 1,
      winningTrades: bot.winningTrades + 1,
      totalPnl: bot.totalPnl + pnl,
      currentBalance: 0,
    });
    
    console.log(`[Bot ${bot.name}] Take profit executed, PnL: ${pnl.toFixed(2)}`);
  } catch (error: any) {
    console.error(`[Bot ${bot.name}] Take profit failed:`, error.message);
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

  const pnlPercent = bot.investment > 0 ? (bot.totalPnl / bot.investment) * 100 : 0;
  const winRate = bot.totalTrades > 0 ? (bot.winningTrades / bot.totalTrades) * 100 : 0;
  const avgProfit = bot.totalTrades > 0 ? bot.totalPnl / bot.totalTrades : 0;

  return {
    ...bot,
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
