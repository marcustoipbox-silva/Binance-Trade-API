import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  BarChart3, 
  TrendingUp, 
  LineChart,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";

export interface IndicatorSignal {
  name: string;
  value: number;
  signal: "buy" | "sell" | "neutral";
  description: string;
}

interface IndicatorSignalsProps {
  signals: IndicatorSignal[];
  symbol: string;
  overallSignal: "buy" | "sell" | "hold";
  buyStrength: number;
  sellStrength: number;
}

const indicatorIcons: Record<string, typeof Activity> = {
  RSI: Activity,
  MACD: BarChart3,
  "Bollinger Bands": TrendingUp,
  EMA: LineChart,
};

const signalColors = {
  buy: { bg: "bg-green-500/10", text: "text-green-500", icon: ArrowUp },
  sell: { bg: "bg-red-500/10", text: "text-red-500", icon: ArrowDown },
  neutral: { bg: "bg-muted", text: "text-muted-foreground", icon: Minus },
};

const overallSignalConfig = {
  buy: { label: "COMPRAR", className: "bg-green-500 text-white animate-pulse" },
  sell: { label: "VENDER", className: "bg-red-500 text-white animate-pulse" },
  hold: { label: "AGUARDAR", className: "bg-muted text-muted-foreground" },
};

export function IndicatorSignals({ 
  signals, 
  symbol, 
  overallSignal, 
  buyStrength, 
  sellStrength 
}: IndicatorSignalsProps) {
  const buyCount = signals.filter(s => s.signal === "buy").length;
  const sellCount = signals.filter(s => s.signal === "sell").length;
  const neutralCount = signals.filter(s => s.signal === "neutral").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">
            Sinais dos Indicadores - {symbol}
          </CardTitle>
          <Badge className={overallSignalConfig[overallSignal].className}>
            {overallSignalConfig[overallSignal].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-green-500 font-medium">Compra ({buyCount})</span>
              <span className="text-red-500 font-medium">Venda ({sellCount})</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden flex">
              <div 
                className="bg-green-500 transition-all" 
                style={{ width: `${buyStrength}%` }} 
              />
              <div 
                className="bg-muted flex-1"
              />
              <div 
                className="bg-red-500 transition-all" 
                style={{ width: `${sellStrength}%` }} 
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {neutralCount} neutro
          </div>
        </div>

        <div className="space-y-2">
          {signals.map((signal) => {
            const Icon = indicatorIcons[signal.name] || Activity;
            const SignalIcon = signalColors[signal.signal].icon;
            const config = signalColors[signal.signal];

            return (
              <div 
                key={signal.name}
                className={`flex items-center justify-between p-3 rounded-lg ${config.bg}`}
                data-testid={`signal-${signal.name.toLowerCase().replace(' ', '-')}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${config.text}`} />
                  <div>
                    <p className="text-sm font-medium">{signal.name}</p>
                    <p className="text-xs text-muted-foreground">{signal.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-sm font-semibold ${config.text}`}>
                    {signal.value.toFixed(2)}
                  </span>
                  <SignalIcon className={`h-4 w-4 ${config.text}`} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Atualizado em tempo real
        </div>
      </CardContent>
    </Card>
  );
}
