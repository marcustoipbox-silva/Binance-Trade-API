import { OrderBook } from "../trading/OrderBook";

export default function OrderBookExample() {
  // todo: remove mock functionality
  const asks = [
    { price: "97,450.00", amount: "0.234", total: "22,803.30", percentage: 45 },
    { price: "97,448.50", amount: "0.156", total: "15,201.97", percentage: 30 },
    { price: "97,447.00", amount: "0.089", total: "8,672.78", percentage: 18 },
    { price: "97,445.50", amount: "0.432", total: "42,096.46", percentage: 85 },
    { price: "97,444.00", amount: "0.278", total: "27,089.43", percentage: 55 },
    { price: "97,442.50", amount: "0.167", total: "16,272.90", percentage: 32 },
  ];

  const bids = [
    { price: "97,432.50", amount: "0.312", total: "30,398.94", percentage: 60 },
    { price: "97,431.00", amount: "0.198", total: "19,291.34", percentage: 38 },
    { price: "97,429.50", amount: "0.456", total: "44,427.85", percentage: 90 },
    { price: "97,428.00", amount: "0.134", total: "13,055.35", percentage: 26 },
    { price: "97,426.50", amount: "0.523", total: "50,954.06", percentage: 100 },
    { price: "97,425.00", amount: "0.267", total: "26,012.48", percentage: 52 },
  ];

  return (
    <div className="w-80">
      <OrderBook
        bids={bids}
        asks={asks}
        symbol="BTC/USDT"
        currentPrice="97,432.50"
      />
    </div>
  );
}
