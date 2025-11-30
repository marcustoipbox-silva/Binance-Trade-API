import { PriceCard } from "../trading/PriceCard";

export default function PriceCardExample() {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-md">
      {/* todo: remove mock functionality */}
      <PriceCard
        symbol="BTC"
        name="Bitcoin"
        price="97,432.50"
        change24h={2.34}
        volume="1.2B"
        onClick={() => console.log("BTC clicked")}
      />
      <PriceCard
        symbol="ETH"
        name="Ethereum"
        price="3,456.78"
        change24h={-1.25}
        volume="890M"
        onClick={() => console.log("ETH clicked")}
      />
    </div>
  );
}
