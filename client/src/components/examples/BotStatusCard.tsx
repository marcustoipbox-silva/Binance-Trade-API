import { BotStatusCard, Bot } from "../bot/BotStatusCard";

export default function BotStatusCardExample() {
  // todo: remove mock functionality
  const bot: Bot = {
    id: "bot-1",
    name: "BTC Scalper Pro",
    symbol: "BTC/USDT",
    status: "active",
    pnl: 1234.56,
    pnlPercent: 12.34,
    totalTrades: 156,
    winRate: 68.5,
    avgProfit: 2.3,
    activeIndicators: ["RSI", "MACD", "EMA"],
    lastSignal: "buy",
    lastSignalTime: "há 5 minutos"
  };

  return (
    <div className="max-w-sm">
      <BotStatusCard
        bot={bot}
        onStart={(id) => console.log("Iniciar bot:", id)}
        onPause={(id) => console.log("Pausar bot:", id)}
        onStop={(id) => console.log("Parar bot:", id)}
        onConfigure={(id) => console.log("Configurar bot:", id)}
      />
    </div>
  );
}
