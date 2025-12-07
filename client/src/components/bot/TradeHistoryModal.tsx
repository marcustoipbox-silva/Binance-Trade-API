import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, Calendar, Filter, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  botId: string;
  symbol: string;
  side: string;
  type: string;
  price: number;
  amount: number;
  total: number;
  pnl: number | null;
  pnlPercent: number | null;
  indicators: string[];
  binanceOrderId: string | null;
  status: string;
  createdAt: string;
}

interface Bot {
  id: string;
  name: string;
  symbol: string;
}

interface TradeHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  botId?: string;
  botName?: string;
}

interface GroupedTrades {
  date: string;
  dateFormatted: string;
  trades: Trade[];
  totalPnl: number;
  buyCount: number;
  sellCount: number;
}

export function TradeHistoryModal({ open, onOpenChange, botId, botName }: TradeHistoryModalProps) {
  const { toast } = useToast();
  const [userSelectedBot, setUserSelectedBot] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  
  useEffect(() => {
    if (!open) {
      setUserSelectedBot(null);
    }
  }, [open]);

  useEffect(() => {
    if (botId) {
      setUserSelectedBot(null);
    }
  }, [botId]);

  const effectiveBot = botId ?? userSelectedBot ?? "all";

  const clearTradesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/trades");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({ title: "Histórico limpo", description: "Todos os trades foram removidos." });
      setShowClearDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ['/api/trades', effectiveBot],
    queryFn: async () => {
      const url = effectiveBot && effectiveBot !== "all" 
        ? `/api/trades?botId=${effectiveBot}` 
        : '/api/trades';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao carregar trades');
      return res.json();
    },
    enabled: open,
  });

  const { data: bots = [] } = useQuery<Bot[]>({
    queryKey: ['/api/bots'],
    enabled: open && !botId,
  });

  const groupedTrades = useMemo(() => {
    const groups: Record<string, GroupedTrades> = {};
    
    trades.forEach(trade => {
      const date = trade.createdAt ? format(new Date(trade.createdAt), 'yyyy-MM-dd') : 'unknown';
      const dateFormatted = trade.createdAt 
        ? format(new Date(trade.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        : 'Data desconhecida';
      
      if (!groups[date]) {
        groups[date] = {
          date,
          dateFormatted,
          trades: [],
          totalPnl: 0,
          buyCount: 0,
          sellCount: 0,
        };
      }
      
      groups[date].trades.push(trade);
      if (trade.pnl) groups[date].totalPnl += trade.pnl;
      if (trade.side === 'buy') groups[date].buyCount++;
      if (trade.side === 'sell') groups[date].sellCount++;
    });

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [trades]);

  const totalStats = useMemo(() => {
    let totalPnl = 0;
    let wins = 0;
    let losses = 0;
    
    trades.forEach(trade => {
      if (trade.pnl) {
        totalPnl += trade.pnl;
        if (trade.pnl > 0) wins++;
        else if (trade.pnl < 0) losses++;
      }
    });
    
    return {
      total: trades.length,
      totalPnl,
      wins,
      losses,
      winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
    };
  }, [trades]);

  const getBotName = (id: string) => {
    const bot = bots.find(b => b.id === id);
    return bot?.name || 'Bot';
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Histórico de Trades
            {botName && <Badge variant="outline">{botName}</Badge>}
          </DialogTitle>
          <DialogDescription>
            Visualize todos os trades realizados agrupados por data
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!botId && bots.length > 0 && (
              <>
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={effectiveBot} onValueChange={setUserSelectedBot}>
                  <SelectTrigger className="w-48" data-testid="select-filter-bot">
                    <SelectValue placeholder="Filtrar por robô" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os robôs</SelectItem>
                    {bots.map(bot => (
                      <SelectItem key={bot.id} value={bot.id}>{bot.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
          
          {trades.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              onClick={() => setShowClearDialog(true)}
              data-testid="button-clear-history"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar Histórico
            </Button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-3 p-3 rounded-lg bg-muted/30">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Trades</p>
            <p className="text-lg font-semibold font-mono" data-testid="text-total-trades">{totalStats.total}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Lucro/Prejuízo</p>
            <p className={cn(
              "text-lg font-semibold font-mono",
              totalStats.totalPnl > 0 ? "text-green-500" : totalStats.totalPnl < 0 ? "text-red-500" : ""
            )} data-testid="text-total-pnl">
              {totalStats.totalPnl >= 0 ? '+' : ''}${totalStats.totalPnl.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Vitórias</p>
            <p className="text-lg font-semibold font-mono text-green-500" data-testid="text-wins">{totalStats.wins}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-lg font-semibold font-mono" data-testid="text-win-rate">{totalStats.winRate.toFixed(1)}%</p>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando histórico...</span>
            </div>
          ) : groupedTrades.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum trade encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {groupedTrades.map(group => (
                <div key={group.date} className="space-y-2">
                  <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur py-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">{group.dateFormatted}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {group.trades.length} {group.trades.length === 1 ? 'trade' : 'trades'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <ArrowDownCircle className="h-3 w-3 mr-1 text-green-500" />
                        {group.buyCount} compras
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <ArrowUpCircle className="h-3 w-3 mr-1 text-red-500" />
                        {group.sellCount} vendas
                      </Badge>
                      {group.totalPnl !== 0 && (
                        <Badge variant={group.totalPnl > 0 ? "default" : "destructive"} className="font-mono text-xs">
                          {group.totalPnl > 0 ? '+' : ''}${group.totalPnl.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {group.trades.map(trade => (
                      <div 
                        key={trade.id} 
                        className="p-3 rounded-lg border bg-card hover-elevate"
                        data-testid={`trade-row-${trade.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {trade.side === 'buy' ? (
                              <div className="p-1.5 rounded-full bg-green-500/10">
                                <ArrowDownCircle className="h-4 w-4 text-green-500" />
                              </div>
                            ) : (
                              <div className="p-1.5 rounded-full bg-red-500/10">
                                <ArrowUpCircle className="h-4 w-4 text-red-500" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {trade.side === 'buy' ? 'Compra' : 'Venda'}
                                </span>
                                <span className="font-mono text-sm">{trade.symbol}</span>
                                {!botId && (
                                  <Badge variant="outline" className="text-xs">
                                    {getBotName(trade.botId)}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{trade.createdAt ? format(new Date(trade.createdAt), 'HH:mm:ss') : '-'}</span>
                                {trade.indicators && trade.indicators.length > 0 && (
                                  <span className="flex gap-1">
                                    {trade.indicators.map((ind, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs py-0">
                                        {ind}
                                      </Badge>
                                    ))}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Quantidade</p>
                                <p className="font-mono text-sm">{trade.amount.toFixed(4)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Preço</p>
                                <p className="font-mono text-sm">${trade.price.toFixed(4)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="font-mono text-sm">${trade.total.toFixed(2)}</p>
                              </div>
                              {trade.pnl !== null && (
                                <div className="min-w-[80px]">
                                  <p className="text-xs text-muted-foreground">P&L</p>
                                  <div className={cn(
                                    "flex items-center gap-1 font-mono text-sm font-medium",
                                    trade.pnl > 0 ? "text-green-500" : trade.pnl < 0 ? "text-red-500" : ""
                                  )}>
                                    {trade.pnl > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                    {trade.pnlPercent !== null && (
                                      <span className="text-xs">({trade.pnlPercent.toFixed(1)}%)</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limpar Histórico de Trades</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja limpar todo o histórico de trades? 
            Esta ação é irreversível e irá remover todos os registros de trades e resetar as estatísticas dos robôs.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => clearTradesMutation.mutate()}
            className="bg-red-500 hover:bg-red-600"
            data-testid="button-confirm-clear"
          >
            {clearTradesMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Limpar Tudo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
