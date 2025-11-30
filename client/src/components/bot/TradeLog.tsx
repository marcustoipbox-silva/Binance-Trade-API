import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { History, Download, Filter } from "lucide-react";

export interface Trade {
  id: string;
  timestamp: string;
  symbol: string;
  side: "buy" | "sell";
  price: number;
  amount: number;
  total: number;
  pnl?: number;
  pnlPercent?: number;
  indicators: string[];
  status: "completed" | "pending" | "cancelled";
}

interface TradeLogProps {
  trades: Trade[];
  onExport?: () => void;
}

export function TradeLog({ trades, onExport }: TradeLogProps) {
  const completedTrades = trades.filter(t => t.status === "completed");
  const totalPnl = completedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winTrades = completedTrades.filter(t => (t.pnl || 0) > 0).length;
  const winRate = completedTrades.length > 0 ? (winTrades / completedTrades.length) * 100 : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Histórico de Operações</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              Win Rate: <span className="font-semibold text-foreground">{winRate.toFixed(1)}%</span>
            </div>
            <div className={`text-xs font-mono ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)} USDT
            </div>
            {onExport && (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onExport}>
                <Download className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 gap-2 px-4 py-2 text-xs text-muted-foreground border-b font-medium">
          <span>Data/Hora</span>
          <span>Par</span>
          <span>Tipo</span>
          <span className="text-right">Preço</span>
          <span className="text-right">Qtd</span>
          <span className="text-right">Total</span>
          <span className="text-right">Lucro/Perda</span>
        </div>
        <ScrollArea className="h-[300px]">
          {trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma operação realizada</p>
            </div>
          ) : (
            <div className="divide-y">
              {trades.map((trade) => (
                <div 
                  key={trade.id}
                  className="grid grid-cols-7 gap-2 px-4 py-2 text-xs items-center hover:bg-muted/30"
                  data-testid={`row-trade-${trade.id}`}
                >
                  <div>
                    <p className="font-medium">{trade.timestamp.split(' ')[1]}</p>
                    <p className="text-muted-foreground">{trade.timestamp.split(' ')[0]}</p>
                  </div>
                  <div className="font-medium">{trade.symbol}</div>
                  <div>
                    <Badge 
                      variant="secondary" 
                      className={`text-[10px] ${trade.side === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
                    >
                      {trade.side === 'buy' ? 'COMPRA' : 'VENDA'}
                    </Badge>
                  </div>
                  <div className="text-right font-mono">${trade.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  <div className="text-right font-mono">{trade.amount.toFixed(6)}</div>
                  <div className="text-right font-mono">${trade.total.toFixed(2)}</div>
                  <div className="text-right">
                    {trade.pnl !== undefined ? (
                      <div className={trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                        <p className="font-mono font-medium">
                          {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                        </p>
                        <p className="text-[10px]">
                          {trade.pnlPercent !== undefined && `${trade.pnlPercent >= 0 ? '+' : ''}${trade.pnlPercent.toFixed(2)}%`}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
