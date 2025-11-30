import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Download, Filter, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Trade {
  id: string;
  timestamp: string;
  botName: string;
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

// todo: remove mock functionality
const mockTrades: Trade[] = [
  { id: "1", timestamp: "2024-01-15 14:32:15", botName: "BTC Scalper", symbol: "BTC/USDT", side: "buy", price: 97234.50, amount: 0.0052, total: 505.62, indicators: ["RSI", "MACD"], status: "completed" },
  { id: "2", timestamp: "2024-01-15 15:45:22", botName: "BTC Scalper", symbol: "BTC/USDT", side: "sell", price: 97856.00, amount: 0.0052, total: 508.85, pnl: 3.23, pnlPercent: 0.64, indicators: ["RSI"], status: "completed" },
  { id: "3", timestamp: "2024-01-15 16:12:08", botName: "ETH Trader", symbol: "ETH/USDT", side: "buy", price: 3456.00, amount: 0.15, total: 518.40, indicators: ["MACD", "EMA"], status: "completed" },
  { id: "4", timestamp: "2024-01-15 17:28:45", botName: "SOL Bot", symbol: "SOL/USDT", side: "sell", price: 52.34, amount: 10, total: 523.40, pnl: -12.50, pnlPercent: -2.33, indicators: ["Bollinger"], status: "completed" },
  { id: "5", timestamp: "2024-01-14 10:15:33", botName: "BTC Scalper", symbol: "BTC/USDT", side: "buy", price: 96500.00, amount: 0.01, total: 965.00, indicators: ["RSI", "EMA"], status: "completed" },
  { id: "6", timestamp: "2024-01-14 11:22:18", botName: "BTC Scalper", symbol: "BTC/USDT", side: "sell", price: 97100.00, amount: 0.01, total: 971.00, pnl: 6.00, pnlPercent: 0.62, indicators: ["MACD"], status: "completed" },
  { id: "7", timestamp: "2024-01-14 14:45:55", botName: "ETH Trader", symbol: "ETH/USDT", side: "buy", price: 3420.00, amount: 0.2, total: 684.00, indicators: ["RSI", "Bollinger"], status: "completed" },
  { id: "8", timestamp: "2024-01-14 16:30:12", botName: "ETH Trader", symbol: "ETH/USDT", side: "sell", price: 3480.00, amount: 0.2, total: 696.00, pnl: 12.00, pnlPercent: 1.75, indicators: ["EMA"], status: "completed" },
];

const statusColors = {
  completed: "bg-green-500/10 text-green-500",
  pending: "bg-yellow-500/10 text-yellow-500",
  cancelled: "bg-muted text-muted-foreground",
};

const statusLabels = {
  completed: "Concluído",
  pending: "Pendente",
  cancelled: "Cancelado",
};

export default function Orders() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [symbolFilter, setSymbolFilter] = useState("all");
  const [sideFilter, setSideFilter] = useState("all");

  const handleExport = () => {
    toast({
      title: "Exportação Iniciada",
      description: "Seu histórico está sendo exportado para CSV...",
    });
  };

  const filterTrades = (trades: Trade[]) => {
    return trades.filter(trade => {
      const matchesSearch = 
        trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trade.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trade.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSymbol = symbolFilter === "all" || trade.symbol === symbolFilter;
      const matchesSide = sideFilter === "all" || trade.side === sideFilter;
      return matchesSearch && matchesSymbol && matchesSide;
    });
  };

  const filteredTrades = filterTrades(mockTrades);
  const totalPnl = filteredTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winTrades = filteredTrades.filter(t => (t.pnl || 0) > 0).length;
  const totalTrades = filteredTrades.filter(t => t.pnl !== undefined).length;
  const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;

  const uniqueSymbols = [...new Set(mockTrades.map(t => t.symbol))];

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
        <Button variant="outline" onClick={handleExport} data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Lucro/Prejuízo Total</p>
            <p className={`text-2xl font-mono font-bold ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total de Operações</p>
            <p className="text-2xl font-mono font-bold">{filteredTrades.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Taxa de Acerto</p>
            <p className={`text-2xl font-mono font-bold ${winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
              {winRate.toFixed(1)}%
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
                      <p className="font-medium">{trade.timestamp.split(' ')[1]}</p>
                      <p className="text-xs text-muted-foreground">{trade.timestamp.split(' ')[0]}</p>
                    </div>
                    <div className="font-medium">{trade.botName}</div>
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
    </div>
  );
}
