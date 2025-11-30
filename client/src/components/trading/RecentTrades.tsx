import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Trade {
  id: string;
  price: string;
  amount: string;
  side: "buy" | "sell";
  time: string;
}

interface RecentTradesProps {
  trades: Trade[];
  symbol: string;
}

export function RecentTrades({ trades, symbol }: RecentTradesProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between gap-2">
          <span>Recent Trades</span>
          <span className="text-xs text-muted-foreground font-normal">{symbol}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs text-muted-foreground border-b">
          <span>Price (USDT)</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Time</span>
        </div>
        <ScrollArea className="h-64">
          <div className="space-y-0.5 px-4">
            {trades.map((trade) => (
              <div 
                key={trade.id}
                className="grid grid-cols-3 gap-2 text-xs font-mono py-0.5"
                data-testid={`row-trade-${trade.id}`}
              >
                <span className={trade.side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                  {trade.price}
                </span>
                <span className="text-right">{trade.amount}</span>
                <span className="text-right text-muted-foreground">{trade.time}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
