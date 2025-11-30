import { RecentTrades } from "../trading/RecentTrades";

export default function RecentTradesExample() {
  // todo: remove mock functionality
  const trades = Array.from({ length: 20 }, (_, i) => ({
    id: `trade-${i}`,
    price: (97430 + Math.random() * 10).toFixed(2),
    amount: (Math.random() * 0.5).toFixed(4),
    side: Math.random() > 0.5 ? "buy" as const : "sell" as const,
    time: `12:${(30 + i).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
  }));

  return (
    <div className="w-72">
      <RecentTrades trades={trades} symbol="BTC/USDT" />
    </div>
  );
}
