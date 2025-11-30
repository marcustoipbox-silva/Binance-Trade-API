import { IndicatorSignals, IndicatorSignal } from "../bot/IndicatorSignals";

export default function IndicatorSignalsExample() {
  // todo: remove mock functionality
  const signals: IndicatorSignal[] = [
    { name: "RSI", value: 28.5, signal: "buy", description: "Zona de sobrevenda (< 30)" },
    { name: "MACD", value: 0.0023, signal: "buy", description: "Cruzamento bullish" },
    { name: "Bollinger Bands", value: 97234, signal: "neutral", description: "Preço dentro das bandas" },
    { name: "EMA", value: 97456, signal: "sell", description: "Death Cross detectado" },
  ];

  return (
    <div className="max-w-md">
      <IndicatorSignals
        signals={signals}
        symbol="BTC/USDT"
        overallSignal="buy"
        buyStrength={60}
        sellStrength={20}
      />
    </div>
  );
}
