import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  Square, 
  TrendingUp, 
  TrendingDown,
  Activity,
  BarChart3,
  Settings,
  RefreshCw,
  RotateCcw
} from "lucide-react";

export type BotStatus = "active" | "paused" | "stopped" | "error";

export interface Bot {
  id: string;
  name: string;
  symbol: string;
  status: BotStatus;
  pnl: number;
  pnlPercent: number;
  totalTrades: number;
  winRate: number;
  avgProfit: number;
  activeIndicators: string[];
  lastSignal?: "buy" | "sell" | "hold";
  lastSignalTime?: string;
}

interface BotStatusCardProps {
  bot: Bot;
  onStart?: (id: string) => void;
  onPause?: (id: string) => void;
  onStop?: (id: string) => void;
  onConfigure?: (id: string) => void;
  onSync?: (id: string) => void;
  onResetStats?: (id: string) => void;
  isSyncing?: boolean;
  isResetting?: boolean;
}

const statusConfig = {
  active: { label: "Ativo", className: "bg-green-500/10 text-green-500", pulse: true },
  paused: { label: "Pausado", className: "bg-yellow-500/10 text-yellow-500", pulse: false },
  stopped: { label: "Parado", className: "bg-muted text-muted-foreground", pulse: false },
  error: { label: "Erro", className: "bg-red-500/10 text-red-500", pulse: true },
};

const signalConfig = {
  buy: { label: "COMPRA", className: "bg-green-500 text-white" },
  sell: { label: "VENDA", className: "bg-red-500 text-white" },
  hold: { label: "AGUARDAR", className: "bg-muted text-muted-foreground" },
};

export function BotStatusCard({ bot, onStart, onPause, onStop, onConfigure, onSync, onResetStats, isSyncing, isResetting }: BotStatusCardProps) {
  const isPositive = bot.pnl >= 0;
  const status = statusConfig[bot.status];

  return (
    <Card className="hover-elevate" data-testid={`card-bot-${bot.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold" data-testid={`text-bot-name-${bot.id}`}>
                {bot.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{bot.symbol}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {bot.lastSignal && (
              <Badge className={`text-[10px] ${signalConfig[bot.lastSignal].className}`}>
                {signalConfig[bot.lastSignal].label}
              </Badge>
            )}
            <Badge 
              variant="secondary" 
              className={`${status.className} ${status.pulse ? 'animate-pulse' : ''}`}
              data-testid={`badge-status-${bot.id}`}
            >
              {status.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Lucro/Prejuízo</p>
            <p className={`text-2xl font-mono font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}
               data-testid={`text-pnl-${bot.id}`}>
              {isPositive ? '+' : ''}{bot.pnl.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' })}
            </p>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
            <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{bot.pnlPercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-lg font-mono font-semibold">{bot.totalTrades}</p>
            <p className="text-[10px] text-muted-foreground">Trades</p>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <p className="text-lg font-mono font-semibold">{bot.winRate.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">Win Rate</p>
          </div>
          <div className="text-center p-2 rounded bg-muted/30">
            <p className={`text-lg font-mono font-semibold ${bot.avgProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {bot.avgProfit >= 0 ? '+' : ''}{bot.avgProfit.toFixed(2)}%
            </p>
            <p className="text-[10px] text-muted-foreground">Lucro Médio</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {bot.activeIndicators.map((ind) => (
            <Badge key={ind} variant="outline" className="text-[10px]">
              {ind}
            </Badge>
          ))}
        </div>

        {bot.lastSignalTime && (
          <p className="text-[10px] text-muted-foreground">
            Último sinal: {bot.lastSignalTime}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {bot.status !== "active" && (
            <Button 
              size="sm"
              className="bg-green-600 hover:bg-green-700 border-green-600"
              onClick={() => onStart?.(bot.id)}
              data-testid={`button-start-${bot.id}`}
            >
              <Play className="h-3 w-3 mr-1" />
              Iniciar
            </Button>
          )}
          {bot.status === "active" && (
            <Button 
              size="sm"
              variant="secondary"
              className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-500"
              onClick={() => onPause?.(bot.id)}
              data-testid={`button-pause-${bot.id}`}
            >
              <Pause className="h-3 w-3 mr-1" />
              Pausar
            </Button>
          )}
          {bot.status !== "stopped" && (
            <Button 
              size="sm"
              variant="destructive"
              onClick={() => onStop?.(bot.id)}
              data-testid={`button-stop-${bot.id}`}
            >
              <Square className="h-3 w-3 mr-1" />
              Parar
            </Button>
          )}
          <Button 
            size="sm"
            variant="outline"
            onClick={() => onSync?.(bot.id)}
            disabled={isSyncing}
            data-testid={`button-sync-${bot.id}`}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => onResetStats?.(bot.id)}
            disabled={isResetting}
            data-testid={`button-reset-${bot.id}`}
          >
            <RotateCcw className={`h-3 w-3 mr-1 ${isResetting ? 'animate-spin' : ''}`} />
            Resetar
          </Button>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => onConfigure?.(bot.id)}
            data-testid={`button-config-${bot.id}`}
          >
            <Settings className="h-3 w-3 mr-1" />
            Config
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
