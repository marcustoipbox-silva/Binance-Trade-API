import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/bot/StatsCard";
import { BotStatusCard, Bot } from "@/components/bot/BotStatusCard";
import { TradeLog, Trade } from "@/components/bot/TradeLog";
import { CreateBotModal } from "@/components/bot/CreateBotModal";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  TrendingUp, 
  Bot as BotIcon, 
  BarChart3,
  Plus
} from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

// todo: remove mock functionality
const mockBots: Bot[] = [
  {
    id: "bot-1",
    name: "BTC Scalper Pro",
    symbol: "BTC/USDT",
    status: "active",
    pnl: 1234.56,
    pnlPercent: 12.34,
    totalTrades: 156,
    winRate: 68.5,
    avgProfit: 2.3,
    activeIndicators: ["RSI", "MACD", "EMA"],
    lastSignal: "buy",
    lastSignalTime: "há 5 min"
  },
  {
    id: "bot-2",
    name: "ETH Swing Trader",
    symbol: "ETH/USDT",
    status: "paused",
    pnl: 456.78,
    pnlPercent: 4.56,
    totalTrades: 45,
    winRate: 62.2,
    avgProfit: 1.8,
    activeIndicators: ["MACD", "Bollinger"],
    lastSignal: "hold",
    lastSignalTime: "há 2h"
  },
  {
    id: "bot-3",
    name: "SOL DCA Bot",
    symbol: "SOL/USDT",
    status: "active",
    pnl: -123.45,
    pnlPercent: -2.1,
    totalTrades: 89,
    winRate: 55.1,
    avgProfit: -0.5,
    activeIndicators: ["RSI", "EMA"],
    lastSignal: "sell",
    lastSignalTime: "há 15 min"
  }
];

const mockTrades: Trade[] = [
  { id: "1", timestamp: "2024-01-15 14:32:15", symbol: "BTC/USDT", side: "buy", price: 97234.50, amount: 0.0052, total: 505.62, indicators: ["RSI", "MACD"], status: "completed" },
  { id: "2", timestamp: "2024-01-15 15:45:22", symbol: "BTC/USDT", side: "sell", price: 97856.00, amount: 0.0052, total: 508.85, pnl: 3.23, pnlPercent: 0.64, indicators: ["RSI"], status: "completed" },
  { id: "3", timestamp: "2024-01-15 16:12:08", symbol: "ETH/USDT", side: "buy", price: 3456.00, amount: 0.15, total: 518.40, indicators: ["MACD", "EMA"], status: "completed" },
  { id: "4", timestamp: "2024-01-15 17:28:45", symbol: "SOL/USDT", side: "sell", price: 52.34, amount: 10, total: 523.40, pnl: -12.50, pnlPercent: -2.33, indicators: ["Bollinger"], status: "completed" },
];

export default function Dashboard() {
  const { toast } = useToast();
  const [bots, setBots] = useState(mockBots);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const totalPnl = bots.reduce((sum, b) => sum + b.pnl, 0);
  const activeBots = bots.filter(b => b.status === "active").length;
  const avgWinRate = bots.reduce((sum, b) => sum + b.winRate, 0) / bots.length;
  const totalTrades = bots.reduce((sum, b) => sum + b.totalTrades, 0);

  const handleBotAction = (action: string, id: string) => {
    toast({
      title: `Robô ${action}`,
      description: `Ação executada com sucesso no robô ${id}`,
    });
    
    if (action === "iniciado") {
      setBots(bots.map(b => b.id === id ? { ...b, status: "active" as const } : b));
    } else if (action === "pausado") {
      setBots(bots.map(b => b.id === id ? { ...b, status: "paused" as const } : b));
    } else if (action === "parado") {
      setBots(bots.map(b => b.id === id ? { ...b, status: "stopped" as const } : b));
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Painel de Controle</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus robôs de trading automatizado</p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} data-testid="button-create-bot">
            <Plus className="h-4 w-4 mr-2" />
            Novo Robô
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Lucro Total"
            value={totalPnl.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' })}
            change={totalPnl > 0 ? 15.3 : -5.2}
            changeLabel="este mês"
            icon={DollarSign}
            trend={totalPnl >= 0 ? "up" : "down"}
          />
          <StatsCard
            title="Robôs Ativos"
            value={`${activeBots}/${bots.length}`}
            icon={BotIcon}
            iconColor="text-primary"
            trend="neutral"
          />
          <StatsCard
            title="Win Rate Médio"
            value={`${avgWinRate.toFixed(1)}%`}
            change={2.1}
            changeLabel="vs semana"
            icon={BarChart3}
            trend="up"
          />
          <StatsCard
            title="Total de Trades"
            value={totalTrades.toString()}
            change={12}
            changeLabel="hoje"
            icon={TrendingUp}
            trend="up"
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Meus Robôs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {bots.map((bot) => (
              <BotStatusCard
                key={bot.id}
                bot={bot}
                onStart={(id) => handleBotAction("iniciado", id)}
                onPause={(id) => handleBotAction("pausado", id)}
                onStop={(id) => handleBotAction("parado", id)}
                onConfigure={(id) => toast({ title: "Configurar", description: `Abrindo configurações do robô ${id}` })}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Operações Recentes</h2>
          <TradeLog 
            trades={mockTrades} 
            onExport={() => toast({ title: "Exportar", description: "Histórico exportado com sucesso!" })}
          />
        </div>

        <CreateBotModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onCreateBot={(config) => {
            const newBot: Bot = {
              id: `bot-${Date.now()}`,
              name: config.name,
              symbol: config.symbol,
              status: "stopped",
              pnl: 0,
              pnlPercent: 0,
              totalTrades: 0,
              winRate: 0,
              avgProfit: 0,
              activeIndicators: [
                config.indicators.rsi.enabled && "RSI",
                config.indicators.macd.enabled && "MACD",
                config.indicators.bollingerBands.enabled && "Bollinger",
                config.indicators.ema.enabled && "EMA",
              ].filter(Boolean) as string[],
            };
            setBots([...bots, newBot]);
            toast({
              title: "Robô criado!",
              description: `${config.name} foi criado com sucesso. Clique em Iniciar para começar.`,
            });
          }}
        />
      </div>
    </TooltipProvider>
  );
}
