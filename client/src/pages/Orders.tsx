import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Download, Filter, History, Loader2, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, subHours, subDays, subWeeks, subMonths, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
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

const statusColors: Record<string, string> = {
  completed: "bg-green-500/10 text-green-500",
  pending: "bg-yellow-500/10 text-yellow-500",
  cancelled: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  completed: "Concluído",
  pending: "Pendente",
  cancelled: "Cancelado",
};

type PeriodFilter = "all" | "1h" | "24h" | "7d" | "30d";

const periodLabels: Record<PeriodFilter, string> = {
  "all": "Todo Período",
  "1h": "Última Hora",
  "24h": "Últimas 24h",
  "7d": "Última Semana",
  "30d": "Último Mês",
};

export default function Orders() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [symbolFilter, setSymbolFilter] = useState("all");
  const [sideFilter, setSideFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [showClearDialog, setShowClearDialog] = useState(false);

  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ['/api/trades'],
    refetchInterval: 30000,
  });

  const { data: bots = [] } = useQuery<Bot[]>({
    queryKey: ['/api/bots'],
  });

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

  const getBotName = (botId: string): string => {
    const bot = bots.find(b => b.id === botId);
    return bot?.name || 'Bot';
  };

  const handleExport = () => {
    if (filteredTrades.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Não há trades para exportar.",
        variant: "destructive",
      });
      return;
    }

    const csvHeader = "Data/Hora,Robô,Par,Tipo,Preço,Quantidade,Total,P&L,P&L %,Status\n";
    const csvData = filteredTrades.map(trade => {
      const dateStr = trade.createdAt ? format(new Date(trade.createdAt), 'dd/MM/yyyy HH:mm:ss') : '-';
      return `${dateStr},${getBotName(trade.botId)},${trade.symbol},${trade.side},${trade.price},${trade.amount},${trade.total},${trade.pnl || ''},${trade.pnlPercent || ''},${trade.status}`;
    }).join('\n');

    const blob = new Blob([csvHeader + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `trades_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();

    toast({
      title: "Exportação Concluída",
      description: "Arquivo CSV gerado com sucesso.",
    });
  };

  const getFilterDate = (period: PeriodFilter): Date | null => {
    const now = new Date();
    switch (period) {
      case "1h": return subHours(now, 1);
      case "24h": return subDays(now, 1);
      case "7d": return subWeeks(now, 1);
      case "30d": return subMonths(now, 1);
      default: return null;
    }
  };

  const filteredTrades = useMemo(() => {
    const filterDate = getFilterDate(periodFilter);
    
    return trades.filter(trade => {
      const botName = getBotName(trade.botId);
      const matchesSearch = 
        trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trade.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSymbol = symbolFilter === "all" || trade.symbol === symbolFilter;
      const matchesSide = sideFilter === "all" || trade.side === sideFilter;
      const matchesPeriod = filterDate === null || 
        (trade.createdAt && isAfter(new Date(trade.createdAt), filterDate));
      return matchesSearch && matchesSymbol && matchesSide && matchesPeriod;
    });
  }, [trades, searchQuery, symbolFilter, sideFilter, periodFilter, bots]);

  const stats = useMemo(() => {
    const totalPnl = filteredTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const tradesWithPnl = filteredTrades.filter(t => t.pnl !== null && t.pnl !== undefined);
    const winTrades = tradesWithPnl.filter(t => (t.pnl || 0) > 0).length;
    const winRate = tradesWithPnl.length > 0 ? (winTrades / tradesWithPnl.length) * 100 : 0;
    return { totalPnl, winRate, total: filteredTrades.length };
  }, [filteredTrades]);

  const uniqueSymbols = useMemo(() => {
    return Array.from(new Set(trades.map(t => t.symbol)));
  }, [trades]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando histórico...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            Histórico de Operações
          </h1>
          <p className="text-sm text-muted-foreground">Visualize todas as operações executadas pelos robôs</p>
        </div>
        <div className="flex items-center gap-2">
          {trades.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setShowClearDialog(true)} 
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              data-testid="button-clear-history"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Histórico
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Lucro/Prejuízo Total</p>
            <p className={`text-2xl font-mono font-bold ${stats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`} data-testid="text-total-pnl">
              {stats.totalPnl >= 0 ? '+' : ''}US$ {stats.totalPnl.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total de Operações</p>
            <p className="text-2xl font-mono font-bold" data-testid="text-total-trades">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Taxa de Acerto</p>
            <p className={`text-2xl font-mono font-bold ${stats.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`} data-testid="text-win-rate">
              {stats.winRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por símbolo, robô ou ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                <SelectTrigger className="w-[140px]" data-testid="select-period-filter">
                  <Clock className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo Período</SelectItem>
                  <SelectItem value="1h">Última Hora</SelectItem>
                  <SelectItem value="24h">Últimas 24h</SelectItem>
                  <SelectItem value="7d">Última Semana</SelectItem>
                  <SelectItem value="30d">Último Mês</SelectItem>
                </SelectContent>
              </Select>
              <Select value={symbolFilter} onValueChange={setSymbolFilter}>
                <SelectTrigger className="w-[130px]" data-testid="select-symbol-filter">
                  <SelectValue placeholder="Par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Pares</SelectItem>
                  {uniqueSymbols.map(symbol => (
                    <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sideFilter} onValueChange={setSideFilter}>
                <SelectTrigger className="w-[100px]" data-testid="select-side-filter">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="buy">Compra</SelectItem>
                  <SelectItem value="sell">Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-8 gap-2 px-4 py-2 text-xs text-muted-foreground border-b font-medium">
            <span>Data/Hora</span>
            <span>Robô</span>
            <span>Par</span>
            <span>Tipo</span>
            <span className="text-right">Preço</span>
            <span className="text-right">Qtd</span>
            <span className="text-right">Total</span>
            <span className="text-right">Lucro/Perda</span>
          </div>
          <ScrollArea className="h-[400px]">
            {filteredTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Filter className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma operação encontrada</p>
                <p className="text-xs mt-1">Os trades realizados aparecerão aqui</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredTrades.map((trade) => (
                  <div 
                    key={trade.id}
                    className="grid grid-cols-8 gap-2 px-4 py-3 text-sm items-center hover:bg-muted/30"
                    data-testid={`row-trade-${trade.id}`}
                  >
                    <div>
                      <p className="font-medium">
                        {trade.createdAt ? format(new Date(trade.createdAt), 'HH:mm:ss') : '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trade.createdAt ? format(new Date(trade.createdAt), 'dd/MM/yyyy') : '-'}
                      </p>
                    </div>
                    <div className="font-medium">{getBotName(trade.botId)}</div>
                    <div className="font-medium">{trade.symbol}</div>
                    <div>
                      <Badge 
                        variant="secondary" 
                        className={`text-[10px] ${trade.side === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
                      >
                        {trade.side === 'buy' ? 'COMPRA' : 'VENDA'}
                      </Badge>
                    </div>
                    <div className="text-right font-mono">${trade.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
                    <div className="text-right font-mono">{trade.amount.toFixed(6)}</div>
                    <div className="text-right font-mono">${trade.total.toFixed(2)}</div>
                    <div className="text-right">
                      {trade.pnl !== null && trade.pnl !== undefined ? (
                        <div className={trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                          <p className="font-mono font-medium">
                            {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                          </p>
                          <p className="text-[10px]">
                            {trade.pnlPercent !== null && trade.pnlPercent !== undefined && 
                              `${trade.pnlPercent >= 0 ? '+' : ''}${trade.pnlPercent.toFixed(2)}%`
                            }
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
    </div>
  );
}
