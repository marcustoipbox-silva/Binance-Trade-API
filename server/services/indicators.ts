import { RSI, MACD, BollingerBands, EMA } from "technicalindicators";
import type { IndicatorSettings, IndicatorSignal, Candle } from "@shared/schema";
import { fetchFearGreedIndex, analyzeFearGreedSignal, isFearGreedDataStale } from "./fearGreed";

export interface IndicatorResult {
  signals: IndicatorSignal[];
  overallSignal: "buy" | "sell" | "hold";
  buyStrength: number;
  sellStrength: number;
  buyCount: number;
  sellCount: number;
  fearGreedValue?: number;
}

export function calculateRSI(closes: number[], period: number = 14): number[] {
  return RSI.calculate({
    values: closes,
    period: period,
  });
}

export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { MACD: number; signal: number; histogram: number }[] {
  const result = MACD.calculate({
    values: closes,
    fastPeriod,
    slowPeriod,
    signalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  
  return result.map(r => ({
    MACD: r.MACD ?? 0,
    signal: r.signal ?? 0,
    histogram: r.histogram ?? 0,
  }));
}

export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number; middle: number; lower: number }[] {
  return BollingerBands.calculate({
    values: closes,
    period,
    stdDev,
  });
}

export function calculateEMA(closes: number[], period: number): number[] {
  return EMA.calculate({
    values: closes,
    period,
  });
}

export async function analyzeIndicators(
  candles: Candle[],
  settings: IndicatorSettings,
  entryFGI?: number | null
): Promise<IndicatorResult> {
  const closes = candles.map((c) => c.close);
  const signals: IndicatorSignal[] = [];
  let buyCount = 0;
  let sellCount = 0;
  let enabledCount = 0;
  let fearGreedValue: number | undefined;

  if (settings.rsi.enabled && closes.length >= settings.rsi.period) {
    enabledCount++;
    const rsiValues = calculateRSI(closes, settings.rsi.period);
    const lastRSI = rsiValues[rsiValues.length - 1];

    let signal: "buy" | "sell" | "neutral" = "neutral";
    let description = `RSI: ${lastRSI?.toFixed(2) || "N/A"}`;

    console.log(`[RSI DEBUG] =====================`);
    console.log(`[RSI DEBUG] settings.rsi =`, JSON.stringify(settings.rsi));
    console.log(`[RSI DEBUG] overbought = ${settings.rsi.overbought} (type: ${typeof settings.rsi.overbought})`);
    console.log(`[RSI DEBUG] oversold = ${settings.rsi.oversold} (type: ${typeof settings.rsi.oversold})`);
    console.log(`[RSI DEBUG] lastRSI = ${lastRSI?.toFixed(2)} (type: ${typeof lastRSI})`);

    if (lastRSI !== undefined) {
      const overbought = Number(settings.rsi.overbought);
      const oversold = Number(settings.rsi.oversold);
      
      console.log(`[RSI DEBUG] Comparando: RSI=${lastRSI.toFixed(2)}, oversold=${oversold}, overbought=${overbought}`);
      console.log(`[RSI DEBUG] RSI < oversold? ${lastRSI} < ${oversold} = ${lastRSI < oversold}`);
      console.log(`[RSI DEBUG] RSI > overbought? ${lastRSI} > ${overbought} = ${lastRSI > overbought}`);
      
      if (lastRSI < oversold) {
        signal = "buy";
        description = `RSI ${lastRSI.toFixed(2)} < ${oversold} (sobrevenda)`;
        buyCount++;
        console.log(`[RSI DEBUG] >>> RESULTADO: BUY`);
      } else if (lastRSI > overbought) {
        signal = "sell";
        description = `RSI ${lastRSI.toFixed(2)} > ${overbought} (sobrecompra)`;
        sellCount++;
        console.log(`[RSI DEBUG] >>> RESULTADO: SELL`);
      } else {
        description = `RSI ${lastRSI.toFixed(2)} (neutro: ${oversold}-${overbought})`;
        console.log(`[RSI DEBUG] >>> RESULTADO: NEUTRO`);
      }
    }

    signals.push({
      name: "RSI",
      value: lastRSI || 0,
      signal,
      description,
    });
  }

  if (settings.macd.enabled && closes.length >= settings.macd.slowPeriod + settings.macd.signalPeriod) {
    enabledCount++;
    const macdValues = calculateMACD(
      closes,
      settings.macd.fastPeriod,
      settings.macd.slowPeriod,
      settings.macd.signalPeriod
    );
    const lastMACD = macdValues[macdValues.length - 1];
    const prevMACD = macdValues[macdValues.length - 2];

    let signal: "buy" | "sell" | "neutral" = "neutral";
    let description = "MACD calculado";

    if (lastMACD && prevMACD) {
      const crossedAbove = lastMACD.MACD > lastMACD.signal && prevMACD.MACD <= prevMACD.signal;
      const crossedBelow = lastMACD.MACD < lastMACD.signal && prevMACD.MACD >= prevMACD.signal;
      const bullish = lastMACD.MACD > lastMACD.signal;
      const bearish = lastMACD.MACD < lastMACD.signal;

      if (crossedAbove) {
        signal = "buy";
        description = "Cruzamento bullish (MACD cruzou acima do sinal)";
        buyCount++;
      } else if (crossedBelow) {
        signal = "sell";
        description = "Cruzamento bearish (MACD cruzou abaixo do sinal)";
        sellCount++;
      } else if (bullish && lastMACD.histogram > 0) {
        signal = "buy";
        description = "Momentum bullish (histograma positivo)";
        buyCount++;
      } else if (bearish && lastMACD.histogram < 0) {
        signal = "sell";
        description = "Momentum bearish (histograma negativo)";
        sellCount++;
      } else {
        description = "Sem cruzamento recente";
      }
    }

    signals.push({
      name: "MACD",
      value: lastMACD?.MACD || 0,
      signal,
      description,
    });
  }

  if (settings.bollingerBands.enabled && closes.length >= settings.bollingerBands.period) {
    enabledCount++;
    const bbValues = calculateBollingerBands(
      closes,
      settings.bollingerBands.period,
      settings.bollingerBands.stdDev
    );
    const lastBB = bbValues[bbValues.length - 1];
    const lastClose = closes[closes.length - 1];

    let signal: "buy" | "sell" | "neutral" = "neutral";
    let description = "Preço dentro das bandas";

    if (lastBB && lastClose) {
      const percentB = (lastClose - lastBB.lower) / (lastBB.upper - lastBB.lower);
      
      if (lastClose <= lastBB.lower || percentB < 0.05) {
        signal = "buy";
        description = "Preço na banda inferior (potencial reversão alta)";
        buyCount++;
      } else if (lastClose >= lastBB.upper || percentB > 0.95) {
        signal = "sell";
        description = "Preço na banda superior (potencial reversão baixa)";
        sellCount++;
      } else if (percentB < 0.2) {
        description = "Próximo da banda inferior";
      } else if (percentB > 0.8) {
        description = "Próximo da banda superior";
      }
    }

    signals.push({
      name: "Bollinger Bands",
      value: lastClose || 0,
      signal,
      description,
    });
  }

  if (settings.ema.enabled && closes.length >= settings.ema.longPeriod) {
    enabledCount++;
    const shortEMA = calculateEMA(closes, settings.ema.shortPeriod);
    const longEMA = calculateEMA(closes, settings.ema.longPeriod);
    
    const lastShortEMA = shortEMA[shortEMA.length - 1];
    const lastLongEMA = longEMA[longEMA.length - 1];
    const prevShortEMA = shortEMA[shortEMA.length - 2];
    const prevLongEMA = longEMA[longEMA.length - 2];
    const lastClose = closes[closes.length - 1];

    let signal: "buy" | "sell" | "neutral" = "neutral";
    let description = "EMA calculada";

    if (lastShortEMA && lastLongEMA && prevShortEMA && prevLongEMA) {
      const goldenCross = lastShortEMA > lastLongEMA && prevShortEMA <= prevLongEMA;
      const deathCross = lastShortEMA < lastLongEMA && prevShortEMA >= prevLongEMA;
      const bullishTrend = lastShortEMA > lastLongEMA && lastClose > lastShortEMA;
      const bearishTrend = lastShortEMA < lastLongEMA && lastClose < lastShortEMA;

      if (goldenCross) {
        signal = "buy";
        description = `Golden Cross (EMA${settings.ema.shortPeriod} cruzou acima EMA${settings.ema.longPeriod})`;
        buyCount++;
      } else if (deathCross) {
        signal = "sell";
        description = `Death Cross (EMA${settings.ema.shortPeriod} cruzou abaixo EMA${settings.ema.longPeriod})`;
        sellCount++;
      } else if (bullishTrend) {
        signal = "buy";
        description = "Tendência de alta (preço acima das EMAs)";
        buyCount++;
      } else if (bearishTrend) {
        signal = "sell";
        description = "Tendência de baixa (preço abaixo das EMAs)";
        sellCount++;
      } else {
        description = "Sem cruzamento recente";
      }
    }

    signals.push({
      name: "EMA",
      value: lastShortEMA || 0,
      signal,
      description,
    });
  }

  if (settings.fearGreed?.enabled) {
    enabledCount++;
    const fgiData = await fetchFearGreedIndex();
    
    if (fgiData && !isFearGreedDataStale()) {
      fearGreedValue = fgiData.value;
      const fgiResult = analyzeFearGreedSignal(
        fgiData.value,
        {
          buyThreshold: settings.fearGreed.buyThreshold,
          sellIncreasePercent: settings.fearGreed.sellIncreasePercent,
          stopLossPercent: settings.fearGreed.stopLossPercent,
        },
        entryFGI ?? undefined
      );

      if (fgiResult.signal === "buy") {
        buyCount++;
      } else if (fgiResult.signal === "sell") {
        sellCount++;
      }

      signals.push({
        name: "FGI",
        value: fgiResult.value,
        signal: fgiResult.signal,
        description: fgiResult.description,
      });

      console.log(`[FGI] Análise: ${fgiResult.description} (sinal: ${fgiResult.signal})`);
    } else {
      console.log(`[FGI] Dados indisponíveis ou obsoletos - indicador ignorado neste ciclo`);
      enabledCount--;
    }
  }

  const buyStrength = enabledCount > 0 ? (buyCount / enabledCount) * 100 : 0;
  const sellStrength = enabledCount > 0 ? (sellCount / enabledCount) * 100 : 0;

  let overallSignal: "buy" | "sell" | "hold" = "hold";
  if (buyCount > 0 && buyCount > sellCount) {
    overallSignal = "buy";
  } else if (sellCount > 0 && sellCount > buyCount) {
    overallSignal = "sell";
  }

  return {
    signals,
    overallSignal,
    buyStrength,
    sellStrength,
    buyCount,
    sellCount,
    fearGreedValue,
  };
}
