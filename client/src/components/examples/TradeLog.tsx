import { TradeLog, Trade } from "../bot/TradeLog";

export default function TradeLogExample() {
  // todo: remove mock functionality
  const trades: Trade[] = [
    { id: "1", timestamp: "2024-01-15 14:32:15", symbol: "BTC/USDT", side: "buy", price: 97234.50, amount: 0.0052, total: 505.62, indicators: ["RSI", "MACD"], status: "completed" },
    { id: "2", timestamp: "2024-01-15 15:45:22", symbol: "BTC/USDT", side: "sell", price: 97856.00, amount: 0.0052, total: 508.85, pnl: 3.23, pnlPercent: 0.64, indicators: ["RSI"], status: "completed" },
    { id: "3", timestamp: "2024-01-15 16:12:08", symbol: "BTC/USDT", side: "buy", price: 97123.00, amount: 0.0048, total: 466.19, indicators: ["MACD", "EMA"], status: "completed" },
    { id: "4", timestamp: "2024-01-15 17:28:45", symbol: "BTC/USDT", side: "sell", price: 96890.00, amount: 0.0048, total: 465.07, pnl: -1.12, pnlPercent: -0.24, indicators: ["Bollinger"], status: "completed" },
  ];

  return (
    <div className="w-full max-w-4xl">
      <TradeLog trades={trades} onExport={() => console.log("Exportar trades")} />
    </div>
  );
}
