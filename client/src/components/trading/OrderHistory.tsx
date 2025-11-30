import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface Order {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  type: string;
  price: string;
  amount: string;
  filled: string;
  status: "open" | "filled" | "cancelled" | "partial";
  time: string;
}

interface OrderHistoryProps {
  openOrders: Order[];
  orderHistory: Order[];
  onCancelOrder?: (id: string) => void;
}

const statusColors = {
  open: "bg-blue-500/10 text-blue-500",
  filled: "bg-green-500/10 text-green-500",
  cancelled: "bg-muted text-muted-foreground",
  partial: "bg-yellow-500/10 text-yellow-500",
};

export function OrderHistory({ openOrders, orderHistory, onCancelOrder }: OrderHistoryProps) {
  const renderOrder = (order: Order, showCancel = false) => (
    <div 
      key={order.id} 
      className="grid grid-cols-6 gap-2 py-2 text-xs items-center border-b last:border-0"
      data-testid={`row-order-${order.id}`}
    >
      <div>
        <p className="font-medium">{order.symbol}</p>
        <p className={`text-[10px] ${order.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
          {order.side.toUpperCase()}
        </p>
      </div>
      <div className="text-right">
        <p className="font-mono">{order.price}</p>
        <p className="text-[10px] text-muted-foreground">{order.type}</p>
      </div>
      <div className="text-right font-mono">{order.amount}</div>
      <div className="text-right font-mono">{order.filled}</div>
      <div className="text-right">
        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${statusColors[order.status]}`}>
          {order.status}
        </Badge>
      </div>
      <div className="text-right flex items-center justify-end gap-2">
        <span className="text-muted-foreground">{order.time}</span>
        {showCancel && order.status === 'open' && (
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={() => onCancelOrder?.(order.id)}
            data-testid={`button-cancel-${order.id}`}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Card className="h-full">
      <Tabs defaultValue="open">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold">Orders</CardTitle>
            <TabsList className="h-7">
              <TabsTrigger value="open" className="text-xs h-6 px-2" data-testid="tab-open-orders">
                Open ({openOrders.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs h-6 px-2" data-testid="tab-order-history">
                History
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-6 gap-2 py-2 text-xs text-muted-foreground border-b">
            <span>Pair</span>
            <span className="text-right">Price</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Filled</span>
            <span className="text-right">Status</span>
            <span className="text-right">Time</span>
          </div>

          <TabsContent value="open" className="m-0">
            <ScrollArea className="h-48">
              {openOrders.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No open orders</p>
              ) : (
                openOrders.map((order) => renderOrder(order, true))
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="m-0">
            <ScrollArea className="h-48">
              {orderHistory.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No order history</p>
              ) : (
                orderHistory.map((order) => renderOrder(order, false))
              )}
            </ScrollArea>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
