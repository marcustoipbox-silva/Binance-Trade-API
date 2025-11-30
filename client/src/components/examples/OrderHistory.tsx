import { OrderHistory } from "../trading/OrderHistory";

export default function OrderHistoryExample() {
  // todo: remove mock functionality
  const openOrders = [
    { id: "1", symbol: "BTC/USDT", side: "buy" as const, type: "Limit", price: "95,000.00", amount: "0.1234", filled: "0.0000", status: "open" as const, time: "12:34" },
    { id: "2", symbol: "ETH/USDT", side: "sell" as const, type: "Stop", price: "3,200.00", amount: "2.5000", filled: "0.0000", status: "open" as const, time: "11:22" },
  ];

  const orderHistory = [
    { id: "3", symbol: "BTC/USDT", side: "buy" as const, type: "Market", price: "97,432.50", amount: "0.0500", filled: "0.0500", status: "filled" as const, time: "10:15" },
    { id: "4", symbol: "SOL/USDT", side: "sell" as const, type: "Limit", price: "52.00", amount: "10.0000", filled: "5.0000", status: "partial" as const, time: "09:45" },
    { id: "5", symbol: "ETH/USDT", side: "buy" as const, type: "Limit", price: "3,400.00", amount: "1.0000", filled: "0.0000", status: "cancelled" as const, time: "08:30" },
  ];

  return (
    <div className="w-full max-w-3xl">
      <OrderHistory
        openOrders={openOrders}
        orderHistory={orderHistory}
        onCancelOrder={(id) => console.log("Cancel order:", id)}
      />
    </div>
  );
}
