import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Activity, 
  BarChart3, 
  LineChart,
  Info,
  Gauge
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface IndicatorSettings {
  rsi: {
    enabled: boolean;
    period: number;
    overbought: number;
    oversold: number;
  };
  macd: {
    enabled: boolean;
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
  };
  bollingerBands: {
    enabled: boolean;
    period: number;
    stdDev: number;
  };
  ema: {
    enabled: boolean;
    shortPeriod: number;
    longPeriod: number;
  };
  fearGreed?: {
    enabled: boolean;
    buyThreshold: number;
    sellIncreasePercent: number;
    stopLossPercent: number;
  };
}

interface IndicatorConfigProps {
  settings: IndicatorSettings;
  onChange: (settings: IndicatorSettings) => void;
}

export function IndicatorConfig({ settings, onChange }: IndicatorConfigProps) {
  const updateRsi = (key: keyof IndicatorSettings['rsi'], value: number | boolean) => {
    onChange({
      ...settings,
      rsi: { ...settings.rsi, [key]: value }
    });
  };

  const updateMacd = (key: keyof IndicatorSettings['macd'], value: number | boolean) => {
    onChange({
      ...settings,
      macd: { ...settings.macd, [key]: value }
    });
  };

  const updateBB = (key: keyof IndicatorSettings['bollingerBands'], value: number | boolean) => {
    onChange({
      ...settings,
      bollingerBands: { ...settings.bollingerBands, [key]: value }
    });
  };

  const updateEma = (key: keyof IndicatorSettings['ema'], value: number | boolean) => {
    onChange({
      ...settings,
      ema: { ...settings.ema, [key]: value }
    });
  };

  const defaultFearGreed = {
    enabled: false,
    buyThreshold: 25,
    sellIncreasePercent: 30,
    stopLossPercent: 20,
  };

  const fearGreed = settings.fearGreed || defaultFearGreed;

  const updateFearGreed = (key: string, value: number | boolean) => {
    onChange({
      ...settings,
      fearGreed: { ...fearGreed, [key]: value }
    });
  };

  return (
    <div className="space-y-4">
      <Card className={settings.rsi.enabled ? "border-primary/50" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-chart-1" />
              <CardTitle className="text-sm font-semibold">RSI (Índice de Força Relativa)</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Mede a velocidade e magnitude das mudanças de preço. Valores abaixo de 30 indicam sobrevenda (sinal de compra), acima de 70 indicam sobrecompra (sinal de venda).</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch 
              checked={settings.rsi.enabled}
              onCheckedChange={(checked) => updateRsi('enabled', checked)}
              data-testid="switch-rsi"
            />
          </div>
        </CardHeader>
        {settings.rsi.enabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Período</Label>
                <Input 
                  type="number" 
                  value={settings.rsi.period}
                  onChange={(e) => updateRsi('period', parseInt(e.target.value) || 14)}
                  className="h-8 text-sm font-mono"
                  data-testid="input-rsi-period"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Sobrecompra</Label>
                <Input 
                  type="number" 
                  value={settings.rsi.overbought}
                  onChange={(e) => updateRsi('overbought', parseInt(e.target.value) || 70)}
                  className="h-8 text-sm font-mono"
                  data-testid="input-rsi-overbought"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Sobrevenda</Label>
                <Input 
                  type="number" 
                  value={settings.rsi.oversold}
                  onChange={(e) => updateRsi('oversold', parseInt(e.target.value) || 30)}
                  className="h-8 text-sm font-mono"
                  data-testid="input-rsi-oversold"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="bg-green-500/10 text-green-500">Compra</Badge>
              <span>quando RSI &lt; {settings.rsi.oversold}</span>
              <Badge variant="secondary" className="bg-red-500/10 text-red-500 ml-2">Venda</Badge>
              <span>quando RSI &gt; {settings.rsi.overbought}</span>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className={settings.macd.enabled ? "border-primary/50" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-chart-2" />
              <CardTitle className="text-sm font-semibold">MACD (Convergência/Divergência)</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Identifica mudanças na força, direção e momentum. Cruzamento da linha MACD acima da linha de sinal indica compra, abaixo indica venda.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch 
              checked={settings.macd.enabled}
              onCheckedChange={(checked) => updateMacd('enabled', checked)}
              data-testid="switch-macd"
            />
          </div>
        </CardHeader>
        {settings.macd.enabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Período Rápido</Label>
                <Input 
                  type="number" 
                  value={settings.macd.fastPeriod}
                  onChange={(e) => updateMacd('fastPeriod', parseInt(e.target.value) || 12)}
                  className="h-8 text-sm font-mono"
                  data-testid="input-macd-fast"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Período Lento</Label>
                <Input 
                  type="number" 
                  value={settings.macd.slowPeriod}
                  onChange={(e) => updateMacd('slowPeriod', parseInt(e.target.value) || 26)}
                  className="h-8 text-sm font-mono"
                  data-testid="input-macd-slow"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Sinal</Label>
                <Input 
                  type="number" 
                  value={settings.macd.signalPeriod}
                  onChange={(e) => updateMacd('signalPeriod', parseInt(e.target.value) || 9)}
                  className="h-8 text-sm font-mono"
                  data-testid="input-macd-signal"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="bg-green-500/10 text-green-500">Compra</Badge>
              <span>quando MACD cruza acima do sinal</span>
              <Badge variant="secondary" className="bg-red-500/10 text-red-500 ml-2">Venda</Badge>
              <span>quando MACD cruza abaixo</span>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className={settings.bollingerBands.enabled ? "border-primary/50" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-chart-3" />
              <CardTitle className="text-sm font-semibold">Bandas de Bollinger</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Mede volatilidade do mercado. Preço tocando a banda inferior sugere compra, tocando a banda superior sugere venda.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch 
              checked={settings.bollingerBands.enabled}
              onCheckedChange={(checked) => updateBB('enabled', checked)}
              data-testid="switch-bollinger"
            />
          </div>
        </CardHeader>
        {settings.bollingerBands.enabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Período</Label>
                <Input 
                  type="number" 
                  value={settings.bollingerBands.period}
                  onChange={(e) => updateBB('period', parseInt(e.target.value) || 20)}
                  className="h-8 text-sm font-mono"
                  data-testid="input-bb-period"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Desvio Padrão</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={settings.bollingerBands.stdDev}
                  onChange={(e) => updateBB('stdDev', parseFloat(e.target.value) || 2)}
                  className="h-8 text-sm font-mono"
                  data-testid="input-bb-stddev"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="bg-green-500/10 text-green-500">Compra</Badge>
              <span>preço na banda inferior</span>
              <Badge variant="secondary" className="bg-red-500/10 text-red-500 ml-2">Venda</Badge>
              <span>preço na banda superior</span>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className={settings.ema.enabled ? "border-primary/50" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-chart-4" />
              <CardTitle className="text-sm font-semibold">EMA (Média Móvel Exponencial)</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Identifica tendências. Cruzamento da EMA curta acima da EMA longa (Golden Cross) indica compra, abaixo (Death Cross) indica venda.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch 
              checked={settings.ema.enabled}
              onCheckedChange={(checked) => updateEma('enabled', checked)}
              data-testid="switch-ema"
            />
          </div>
        </CardHeader>
        {settings.ema.enabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">EMA Curta</Label>
                <Input 
                  type="number" 
                  value={settings.ema.shortPeriod}
                  onChange={(e) => updateEma('shortPeriod', parseInt(e.target.value) || 12)}
                  className="h-8 text-sm font-mono"
                  data-testid="input-ema-short"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">EMA Longa</Label>
                <Input 
                  type="number" 
                  value={settings.ema.longPeriod}
                  onChange={(e) => updateEma('longPeriod', parseInt(e.target.value) || 26)}
                  className="h-8 text-sm font-mono"
                  data-testid="input-ema-long"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="bg-green-500/10 text-green-500">Compra</Badge>
              <span>Golden Cross (EMA curta cruza acima)</span>
              <Badge variant="secondary" className="bg-red-500/10 text-red-500 ml-2">Venda</Badge>
              <span>Death Cross</span>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className={fearGreed.enabled ? "border-primary/50" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-chart-5" />
              <CardTitle className="text-sm font-semibold">FGI (Índice de Medo e Ganância)</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Mede o sentimento do mercado crypto. Valores baixos (0-25) indicam medo extremo (oportunidade de compra), valores altos (75-100) indicam ganância extrema (considerar venda). Atualiza diariamente.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch 
              checked={fearGreed.enabled}
              onCheckedChange={(checked) => updateFearGreed('enabled', checked)}
              data-testid="switch-fgi"
            />
          </div>
        </CardHeader>
        {fearGreed.enabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Limite de Compra (FGI ≤)</Label>
                <Input 
                  type="number" 
                  value={fearGreed.buyThreshold}
                  onChange={(e) => updateFearGreed('buyThreshold', parseInt(e.target.value) || 25)}
                  className="h-8 text-sm font-mono"
                  min={1}
                  max={100}
                  data-testid="input-fgi-buy-threshold"
                />
                <span className="text-xs text-muted-foreground">Compra quando FGI ≤ {fearGreed.buyThreshold}</span>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">% Aumento p/ Venda</Label>
                <Input 
                  type="number" 
                  value={fearGreed.sellIncreasePercent}
                  onChange={(e) => updateFearGreed('sellIncreasePercent', parseInt(e.target.value) || 30)}
                  className="h-8 text-sm font-mono"
                  min={1}
                  max={500}
                  data-testid="input-fgi-sell-increase"
                />
                <span className="text-xs text-muted-foreground">Vende se FGI subir {fearGreed.sellIncreasePercent}%</span>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">% Queda p/ Stop Loss</Label>
                <Input 
                  type="number" 
                  value={fearGreed.stopLossPercent}
                  onChange={(e) => updateFearGreed('stopLossPercent', parseInt(e.target.value) || 20)}
                  className="h-8 text-sm font-mono"
                  min={1}
                  max={100}
                  data-testid="input-fgi-stop-loss"
                />
                <span className="text-xs text-muted-foreground">Stop se FGI cair {fearGreed.stopLossPercent}%</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="bg-green-500/10 text-green-500">Compra</Badge>
              <span>FGI ≤ {fearGreed.buyThreshold} (Medo)</span>
              <Badge variant="secondary" className="bg-red-500/10 text-red-500 ml-2">Venda</Badge>
              <span>FGI sobe {fearGreed.sellIncreasePercent}% ou cai {fearGreed.stopLossPercent}%</span>
            </div>
            <div className="text-xs text-amber-500 bg-amber-500/10 p-2 rounded">
              Nota: O FGI é atualizado diariamente. Ideal para estratégias de médio/longo prazo.
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
