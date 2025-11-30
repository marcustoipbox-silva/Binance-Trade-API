import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IndicatorSignals, IndicatorSignal } from "@/components/bot/IndicatorSignals";
import { IndicatorConfig, IndicatorSettings } from "@/components/bot/IndicatorConfig";
import { TradeLog, Trade } from "@/components/bot/TradeLog";
import { TradingChart } from "@/components/trading/TradingChart";
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Square, 
  Settings,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";
import { Link } from "wouter";

// todo: remove mock functionality
const mockSignals: IndicatorSignal[] = [
  { name: "RSI", value: 28.5, signal: "buy", description: "Zona de sobrevenda (< 30)" },
  { name: "MACD", value: 0.0023, signal: "buy", description: "Cruzamento bullish" },
  { name: "Bollinger Bands", value: 97234, signal: "neutral", description: "Preço dentro das bandas" },
  { name: "EMA", value: 97456, signal: "sell", description: "Death Cross detectado" },
];

const mockTrades: Trade[] = [
  { id: "1", timestamp: "2024-01-15 14:32:15", symbol: "BTC/USDT", side: "buy", price: 97234.50, amount: 0.0052, total: 505.62, indicators: ["RSI", "MACD"], status: "completed" },
  { id: "2", timestamp: "2024-01-15 15:45:22", symbol: "BTC/USDT", side: "sell", price: 97856.00, amount: 0.0052, total: 508.85, pnl: 3.23, pnlPercent: 0.64, indicators: ["RSI"], status: "completed" },
  { id: "3", timestamp: "2024-01-15 16:12:08", symbol: "BTC/USDT", side: "buy", price: 97123.00, amount: 0.0048, total: 466.19, indicators: ["MACD", "EMA"], status: "completed" },
];

const mockChartData = Array.from({ length: 48 }, (_, i) => {
  const basePrice = 97000 + Math.random() * 1000;
  const volatility = 200;
  return {
    time: `${i % 24}:00`,
    open: basePrice,
    high: basePrice + Math.random() * volatility,
    low: basePrice - Math.random() * volatility,
    close: basePrice + (Math.random() - 0.5) * volatility,
  };
});

const defaultIndicators: IndicatorSettings = {
  rsi: { enabled: true, period: 14, overbought: 70, oversold: 30 },
  macd: { enabled: true, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  bollingerBands: { enabled: false, period: 20, stdDev: 2 },
  ema: { enabled: true, shortPeriod: 12, longPeriod: 26 },
};

export default function BotDetails() {
  const { toast } = useToast();
  const [status, setStatus] = useState<"active" | "paused" | "stopped">("active");
  const [indicators, setIndicators] = useState(defaultIndicators);

  const pnl = 1234.56;
  const isPositive = pnl >= 0;

  const handleAction = (action: string) => {
    if (action === "start") setStatus("active");
    else if (action === "pause") setStatus("paused");
    else if (action === "stop") setStatus("stopped");
    
    toast({
      title: `Robô ${action === "start" ? "iniciado" : action === "pause" ? "pausado" : "parado"}`,
      description: "Ação executada com sucesso!",
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">BTC Scalper Pro</h1>
              <Badge 
                variant="secondary"
                className={
                  status === "active" ? "bg-green-500/10 text-green-500 animate-pulse" :
                  status === "paused" ? "bg-yellow-500/10 text-yellow-500" :
                  "bg-muted text-muted-foreground"
                }
              >
                {status === "active" ? "Ativo" : status === "paused" ? "Pausado" : "Parado"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">BTC/USDT | Indicadores: RSI, MACD, EMA</p>
          </div>
          <div className="flex gap-2">
            {status !== "active" && (
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction("start")}>
                <Play className="h-4 w-4 mr-2" />
                Iniciar
              </Button>
            )}
            {status === "active" && (
              <Button variant="secondary" className="bg-yellow-600/20 text-yellow-500" onClick={() => handleAction("pause")}>
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </Button>
            )}
            {status !== "stopped" && (
              <Button variant="destructive" onClick={() => handleAction("stop")}>
                <Square className="h-4 w-4 mr-2" />
                Parar
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Lucro/Prejuízo</p>
              <p className={`text-2xl font-mono font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}${pnl.toFixed(2)}
              </p>
              <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>+12.34% total</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total de Trades</p>
              <p className="text-2xl font-mono font-bold">156</p>
              <p className="text-xs text-muted-foreground">12 hoje</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
              <p className="text-2xl font-mono font-bold text-green-500">68.5%</p>
              <p className="text-xs text-muted-foreground">107 wins / 49 losses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Último Sinal</p>
              <Badge className="bg-green-500 text-white">COMPRAR</Badge>
              <p className="text-xs text-muted-foreground mt-1">há 5 minutos</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TradingChart
              symbol="BTC/USDT"
              data={mockChartData}
              currentPrice="97.432,50"
              change24h={2.34}
            />
          </div>
          <div>
            <IndicatorSignals
              signals={mockSignals}
              symbol="BTC/USDT"
              overallSignal="buy"
              buyStrength={60}
              sellStrength={20}
            />
          </div>
        </div>

        <Tabs defaultValue="trades">
          <TabsList>
            <TabsTrigger value="trades">
              <Activity className="h-4 w-4 mr-2" />
              Operações
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trades" className="mt-4">
            <TradeLog trades={mockTrades} />
          </TabsContent>

          <TabsContent value="config" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuração dos Indicadores</CardTitle>
              </CardHeader>
              <CardContent>
                <IndicatorConfig settings={indicators} onChange={setIndicators} />
                <div className="flex justify-end mt-4">
                  <Button onClick={() => toast({ title: "Salvo!", description: "Configurações atualizadas." })}>
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
