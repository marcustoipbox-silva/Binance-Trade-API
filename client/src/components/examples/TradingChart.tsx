import { TradingChart } from "../trading/TradingChart";

export default function TradingChartExample() {
  // todo: remove mock functionality
  const mockData = Array.from({ length: 24 }, (_, i) => {
    const basePrice = 97000 + Math.random() * 1000;
    const volatility = 200;
    return {
      time: `${i}:00`,
      open: basePrice,
      high: basePrice + Math.random() * volatility,
      low: basePrice - Math.random() * volatility,
      close: basePrice + (Math.random() - 0.5) * volatility,
    };
  });

  return (
    <div className="w-full max-w-3xl">
      <TradingChart
        symbol="BTC/USDT"
        data={mockData}
        currentPrice="97,432.50"
        change24h={2.34}
      />
    </div>
  );
}
