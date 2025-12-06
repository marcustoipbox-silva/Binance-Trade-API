import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/bot/StatsCard";
import { BotStatusCard } from "@/components/bot/BotStatusCard";
import { TradeLog } from "@/components/bot/TradeLog";
import { BalancePanel } from "@/components/bot/BalancePanel";
import { ActivityLog } from "@/components/bot/ActivityLog";
import { CreateBotModal } from "@/components/bot/CreateBotModal";
import { EditBotModal } from "@/components/bot/EditBotModal";
import { TradeHistoryModal } from "@/components/bot/TradeHistoryModal";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  DollarSign, 
  TrendingUp, 
  Bot as BotIcon, 
  BarChart3,
  Plus,
  AlertCircle,
  Loader2
} from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import type { BotWithStats, Trade } from "@shared/schema";

interface Stats {
  totalPnl: number;
  pnlPercent: number;
  activeBots: number;
  totalBots: number;
  totalTrades: number;
  avgWinRate: number;
  recentTrades: Trade[];
}

export default function Dashboard() {
  const { toast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editBotId, setEditBotId] = useState<string | null>(null);
  const [tradeHistoryOpen, setTradeHistoryOpen] = useState(false);
  const [tradeHistoryBotId, setTradeHistoryBotId] = useState<string | undefined>();
  const [tradeHistoryBotName, setTradeHistoryBotName] = useState<string | undefined>();

  const openTradeHistory = (botId?: string, botName?: string) => {
    setTradeHistoryBotId(botId);
    setTradeHistoryBotName(botName);
    setTradeHistoryOpen(true);
  };

  const { data: connectionStatus } = useQuery<{ connected: boolean; message?: string }>({
    queryKey: ["/api/binance/status"],
    refetchInterval: 30000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    refetchInterval: 10000,
  });

  const { data: bots = [], isLoading: botsLoading } = useQuery<BotWithStats[]>({
    queryKey: ["/api/bots"],
    refetchInterval: 5000,
  });

  const startBotMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/bots/${id}/start`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Robô iniciado", description: "O robô começou a operar." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const pauseBotMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/bots/${id}/pause`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Robô pausado", description: "O robô foi pausado." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const stopBotMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/bots/${id}/stop`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Robô parado", description: "O robô foi parado." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const syncBalanceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/bots/${id}/sync-balance`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/binance/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({ 
        title: "Saldo sincronizado!", 
        description: data.message || "O saldo foi atualizado com a Binance." 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao sincronizar", description: error.message, variant: "destructive" });
    },
  });

  const resetStatsMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/bots/${id}/reset-stats`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ 
        title: "Estatísticas resetadas!", 
        description: "Os dados do robô foram zerados. Você pode sincronizar para buscar posições reais." 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao resetar", description: error.message, variant: "destructive" });
    },
  });

  const createBotMutation = useMutation({
    mutationFn: async (config: any) => {
      return apiRequest("POST", "/api/bots", config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Robô criado!", description: "O robô foi criado com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar robô", description: error.message, variant: "destructive" });
    },
  });

  const isLoading = statsLoading || botsLoading;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Painel de Controle</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus robôs de trading automatizado</p>
          </div>
          <Button 
            onClick={() => {
              if (!connectionStatus?.connected) {
                toast({
                  title: "API não conectada",
                  description: "Vá em Configurações e ative o Modo Demo ou conecte sua API Binance para criar robôs.",
                  variant: "destructive",
                });
                return;
              }
              setCreateModalOpen(true);
            }} 
            data-testid="button-create-bot"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Robô
          </Button>
        </div>

        {!connectionStatus?.connected && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
              <span>API Binance não conectada. Configure suas chaves de API para começar a operar.</span>
              <Link href="/settings">
                <Button variant="outline" size="sm">Configurar API</Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Lucro Total"
            value={isLoading ? "..." : (stats?.totalPnl || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'USD' })}
            change={stats?.pnlPercent || 0}
            changeLabel="total"
            icon={DollarSign}
            trend={(stats?.totalPnl || 0) >= 0 ? "up" : "down"}
          />
          <StatsCard
            title="Robôs Ativos"
            value={isLoading ? "..." : `${stats?.activeBots || 0}/${stats?.totalBots || 0}`}
            icon={BotIcon}
            iconColor="text-primary"
            trend="neutral"
          />
          <StatsCard
            title="Win Rate Médio"
            value={isLoading ? "..." : `${(stats?.avgWinRate || 0).toFixed(1)}%`}
            icon={BarChart3}
            trend="up"
          />
          <StatsCard
            title="Total de Trades"
            value={isLoading ? "..." : (stats?.totalTrades || 0).toString()}
            icon={TrendingUp}
            trend="up"
            onClick={() => openTradeHistory()}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Meus Robôs</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : bots.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BotIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum robô criado ainda.</p>
              <p className="text-sm">Clique em "Novo Robô" para começar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {bots.map((bot) => (
                <BotStatusCard
                  key={bot.id}
                  bot={{
                    id: bot.id,
                    name: bot.name,
                    symbol: bot.symbol,
                    status: bot.status as "active" | "paused" | "stopped",
                    pnl: bot.totalPnl,
                    pnlPercent: bot.pnlPercent,
                    totalTrades: bot.totalTrades,
                    winRate: bot.winRate,
                    avgProfit: bot.avgProfit,
                    activeIndicators: bot.activeIndicators,
                    lastSignal: bot.lastSignal as "buy" | "sell" | "hold" | undefined,
                    lastSignalTime: bot.lastSignalTime ? new Date(bot.lastSignalTime).toLocaleString('pt-BR') : undefined,
                  }}
                  onStart={(id) => startBotMutation.mutate(id)}
                  onPause={(id) => pauseBotMutation.mutate(id)}
                  onStop={(id) => stopBotMutation.mutate(id)}
                  onSync={(id) => syncBalanceMutation.mutate(id)}
                  onResetStats={(id) => resetStatsMutation.mutate(id)}
                  onTradesClick={(id, name) => openTradeHistory(id, name)}
                  isSyncing={syncBalanceMutation.isPending}
                  isResetting={resetStatsMutation.isPending}
                  onConfigure={(id) => {
                    setEditBotId(id);
                    setEditModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Operações Executadas</h2>
            <ActivityLog maxItems={15} />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">Saldo Testnet</h2>
            <BalancePanel />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Histórico Completo</h2>
          <TradeLog 
            trades={(stats?.recentTrades || []).map(t => ({
              id: t.id,
              timestamp: t.createdAt ? new Date(t.createdAt).toLocaleString('pt-BR') : "",
              symbol: t.symbol,
              side: t.side as "buy" | "sell",
              price: t.price,
              amount: t.amount,
              total: t.total,
              pnl: t.pnl || undefined,
              pnlPercent: t.pnlPercent || undefined,
              indicators: t.indicators,
              status: t.status as "completed" | "pending" | "cancelled",
            }))}
            onExport={() => toast({ title: "Exportar", description: "Histórico exportado com sucesso!" })}
          />
        </div>

        <CreateBotModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onCreateBot={(config) => {
            createBotMutation.mutate({
              name: config.name,
              symbol: config.symbol,
              investment: config.investment,
              stopLoss: config.stopLoss,
              takeProfit: config.takeProfit,
              indicators: config.indicators,
              minSignals: config.minSignals,
              interval: "1h",
            });
          }}
        />

        <EditBotModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          botId={editBotId}
        />

        <TradeHistoryModal
          open={tradeHistoryOpen}
          onOpenChange={setTradeHistoryOpen}
          botId={tradeHistoryBotId}
          botName={tradeHistoryBotName}
        />
      </div>
    </TooltipProvider>
  );
}
