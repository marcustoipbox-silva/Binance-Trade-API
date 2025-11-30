import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface OrderFormProps {
  symbol: string;
  currentPrice: string;
  availableBalance: string;
  asset: string;
  onSubmit?: (order: { side: string; type: string; price: string; amount: string }) => void;
}

export function OrderForm({ symbol, currentPrice, availableBalance, asset, onSubmit }: OrderFormProps) {
  const [orderType, setOrderType] = useState("limit");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState(currentPrice.replace(/,/g, ''));
  const [amount, setAmount] = useState("");

  const percentages = [25, 50, 75, 100];

  const handlePercentageClick = (pct: number) => {
    const balance = parseFloat(availableBalance.replace(/,/g, ''));
    const priceNum = parseFloat(price);
    if (balance && priceNum) {
      const maxAmount = (balance * pct / 100) / priceNum;
      setAmount(maxAmount.toFixed(6));
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit({ side, type: orderType, price, amount });
    }
    console.log(`${side.toUpperCase()} ${orderType}: ${amount} ${symbol.split('/')[0]} @ ${price}`);
  };

  const total = (parseFloat(amount || '0') * parseFloat(price || '0')).toFixed(2);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Place Order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={side === "buy" ? "default" : "outline"}
            className={side === "buy" ? "bg-green-600 hover:bg-green-700 border-green-600" : ""}
            onClick={() => setSide("buy")}
            data-testid="button-buy-side"
          >
            Buy
          </Button>
          <Button
            variant={side === "sell" ? "default" : "outline"}
            className={side === "sell" ? "bg-red-600 hover:bg-red-700 border-red-600" : ""}
            onClick={() => setSide("sell")}
            data-testid="button-sell-side"
          >
            Sell
          </Button>
        </div>

        <Tabs value={orderType} onValueChange={setOrderType}>
          <TabsList className="w-full">
            <TabsTrigger value="limit" className="flex-1" data-testid="tab-limit">Limit</TabsTrigger>
            <TabsTrigger value="market" className="flex-1" data-testid="tab-market">Market</TabsTrigger>
            <TabsTrigger value="stop" className="flex-1" data-testid="tab-stop">Stop</TabsTrigger>
          </TabsList>

          <TabsContent value="limit" className="space-y-3 mt-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Price (USDT)</Label>
              <Input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="font-mono text-right"
                data-testid="input-price"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Amount ({symbol.split('/')[0]})</Label>
              <Input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="font-mono text-right"
                data-testid="input-amount"
              />
            </div>
          </TabsContent>

          <TabsContent value="market" className="space-y-3 mt-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Amount ({symbol.split('/')[0]})</Label>
              <Input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="font-mono text-right"
                data-testid="input-market-amount"
              />
            </div>
            <p className="text-xs text-muted-foreground">Market price: ${currentPrice}</p>
          </TabsContent>

          <TabsContent value="stop" className="space-y-3 mt-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Stop Price (USDT)</Label>
              <Input
                type="text"
                placeholder="0.00"
                className="font-mono text-right"
                data-testid="input-stop-price"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Limit Price (USDT)</Label>
              <Input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="font-mono text-right"
                data-testid="input-limit-price"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Amount ({symbol.split('/')[0]})</Label>
              <Input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="font-mono text-right"
                data-testid="input-stop-amount"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-1">
          {percentages.map((pct) => (
            <Button
              key={pct}
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs"
              onClick={() => handlePercentageClick(pct)}
              data-testid={`button-pct-${pct}`}
            >
              {pct}%
            </Button>
          ))}
        </div>

        <div className="space-y-1 py-2 border-t">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Available</span>
            <span className="font-mono">{availableBalance} {asset}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total</span>
            <span className="font-mono">{total} USDT</span>
          </div>
        </div>

        <Button
          className={`w-full h-11 font-semibold ${
            side === "buy" 
              ? "bg-green-600 hover:bg-green-700 border-green-600" 
              : "bg-red-600 hover:bg-red-700 border-red-600"
          }`}
          onClick={handleSubmit}
          data-testid="button-submit-order"
        >
          {side === "buy" ? "Buy" : "Sell"} {symbol.split('/')[0]}
        </Button>
      </CardContent>
    </Card>
  );
}
