import { BalancePanel } from "../trading/BalancePanel";

export default function BalancePanelExample() {
  // todo: remove mock functionality
  const assets = [
    { symbol: "BTC", name: "Bitcoin", balance: "0.5234", valueUSD: "50,987.34", change24h: 2.34 },
    { symbol: "ETH", name: "Ethereum", balance: "2.8901", valueUSD: "9,989.45", change24h: -1.25 },
    { symbol: "USDT", name: "Tether", balance: "5,000.00", valueUSD: "5,000.00", change24h: 0.01 },
    { symbol: "SOL", name: "Solana", balance: "45.234", valueUSD: "2,345.67", change24h: 5.67 },
  ];

  return (
    <div className="w-80">
      <BalancePanel
        totalBalance="68,322.46"
        change24h={1.89}
        assets={assets}
      />
    </div>
  );
}
