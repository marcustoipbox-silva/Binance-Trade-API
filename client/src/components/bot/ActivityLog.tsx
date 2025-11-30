import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, TrendingDown, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Trade } from "@shared/schema";

interface ActivityLogProps {
  botId?: string;
  maxItems?: number;
}

export function ActivityLog({ botId, maxItems = 10 }: ActivityLogProps) {
  const queryKey = botId ? ["/api/trades", { botId }] : ["/api/trades"];
  
  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
    refetchInterval: 5000,
  });

  const filteredTrades = botId 
    ? trades.filter(t => t.botId === botId)
    : trades;

  const recentTrades = filteredTrades.slice(0, maxItems);

  const formatTime = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit'
    });
  };

  return (
    <Card data-testid="card-activity-log">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Atividade do Robô
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Carregando...
          </div>
        ) : recentTrades.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma operação executada ainda</p>
            <p className="text-xs mt-1">O robô está analisando o mercado</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {recentTrades.map((trade) => (
                <div 
                  key={trade.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                  data-testid={`activity-trade-${trade.id}`}
                >
                  <div className={`p-2 rounded-full ${
                    trade.side === 'buy' 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-red-500/20 text-red-500'
                  }`}>
                    {trade.side === 'buy' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'}>
                        {trade.side === 'buy' ? 'COMPRA' : 'VENDA'}
                      </Badge>
                      <span className="font-medium text-sm">{trade.symbol}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(trade.createdAt)} {formatTime(trade.createdAt)}
                      </span>
                    </div>
                    
                    <div className="mt-1 text-sm">
                      <span className="text-muted-foreground">Preço: </span>
                      <span className="font-mono">
                        ${trade.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-muted-foreground ml-2">Qtd: </span>
                      <span className="font-mono">{trade.amount}</span>
                    </div>
                    
                    {trade.pnl !== null && trade.pnl !== undefined && (
                      <div className={`mt-1 text-sm font-medium ${
                        trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {trade.pnl >= 0 ? '+' : ''}
                        ${trade.pnl.toFixed(2)} ({trade.pnlPercent?.toFixed(2)}%)
                      </div>
                    )}
                    
                    {trade.indicators && trade.indicators.length > 0 && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {trade.indicators.map((ind, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {ind}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
