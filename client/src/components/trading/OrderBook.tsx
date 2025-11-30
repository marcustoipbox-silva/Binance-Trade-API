import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OrderLevel {
  price: string;
  amount: string;
  total: string;
  percentage: number;
}

interface OrderBookProps {
  bids: OrderLevel[];
  asks: OrderLevel[];
  symbol: string;
  currentPrice: string;
}

export function OrderBook({ bids, asks, symbol, currentPrice }: OrderBookProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2">
          <span>Order Book</span>
          <span className="text-xs text-muted-foreground font-normal">{symbol}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs text-muted-foreground border-b">
          <span>Price (USDT)</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Total</span>
        </div>
        
        <ScrollArea className="h-40">
          <div className="space-y-0.5 px-4">
            {asks.slice().reverse().map((ask, i) => (
              <div 
                key={`ask-${i}`}
                className="grid grid-cols-3 gap-2 text-xs font-mono relative py-0.5"
                data-testid={`row-ask-${i}`}
              >
                <div 
                  className="absolute inset-0 bg-red-500/10 origin-right" 
                  style={{ width: `${ask.percentage}%` }}
                />
                <span className="text-red-500 relative z-10">{ask.price}</span>
                <span className="text-right relative z-10">{ask.amount}</span>
                <span className="text-right text-muted-foreground relative z-10">{ask.total}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="px-4 py-2 border-y bg-card">
          <p className="text-center font-mono font-semibold text-lg" data-testid="text-current-price">
            ${currentPrice}
          </p>
        </div>
        
        <ScrollArea className="h-40">
          <div className="space-y-0.5 px-4">
            {bids.map((bid, i) => (
              <div 
                key={`bid-${i}`}
                className="grid grid-cols-3 gap-2 text-xs font-mono relative py-0.5"
                data-testid={`row-bid-${i}`}
              >
                <div 
                  className="absolute inset-0 bg-green-500/10 origin-right" 
                  style={{ width: `${bid.percentage}%` }}
                />
                <span className="text-green-500 relative z-10">{bid.price}</span>
                <span className="text-right relative z-10">{bid.amount}</span>
                <span className="text-right text-muted-foreground relative z-10">{bid.total}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
