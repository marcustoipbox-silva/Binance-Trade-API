import { OrderForm } from "../trading/OrderForm";

export default function OrderFormExample() {
  return (
    <div className="w-80">
      <OrderForm
        symbol="BTC/USDT"
        currentPrice="97,432.50"
        availableBalance="10,000.00"
        asset="USDT"
        onSubmit={(order) => console.log("Order submitted:", order)}
      />
    </div>
  );
}
