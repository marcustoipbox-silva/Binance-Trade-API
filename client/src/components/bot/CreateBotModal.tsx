import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IndicatorConfig, IndicatorSettings } from "./IndicatorConfig";
import { useQuery } from "@tanstack/react-query";
import { Bot, Plus, TrendingUp, ChevronsUpDown, Check, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateBotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBot?: (config: BotConfig) => void;
}

export interface BotConfig {
  name: string;
  symbol: string;
  investment: number;
  stopLoss: number;
  takeProfit: number;
  indicators: IndicatorSettings;
  minSignals: number;
  interval: string;
}

const defaultIndicators: IndicatorSettings = {
  rsi: { enabled: true, period: 14, overbought: 70, oversold: 30 },
  macd: { enabled: true, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  bollingerBands: { enabled: false, period: 20, stdDev: 2 },
  ema: { enabled: true, shortPeriod: 12, longPeriod: 26 },
};

interface TradingPair {
  symbol: string;
  formatted: string;
}

export function CreateBotModal({ open, onOpenChange, onCreateBot }: CreateBotModalProps) {
  const [step, setStep] = useState<"basic" | "indicators" | "risk">("basic");
  const [symbolSearch, setSymbolSearch] = useState("");
  const [symbolPopoverOpen, setSymbolPopoverOpen] = useState(false);
  const [config, setConfig] = useState<BotConfig>({
    name: "",
    symbol: "BTC/USDT",
    investment: 100,
    stopLoss: 5,
    takeProfit: 10,
    indicators: defaultIndicators,
    minSignals: 2,
    interval: "1h",
  });

  const symbolsQueryKey = symbolSearch.trim() 
    ? `/api/binance/symbols?search=${encodeURIComponent(symbolSearch.trim())}`
    : "/api/binance/symbols";
    
  const { data: symbols = [], isLoading: symbolsLoading } = useQuery<TradingPair[]>({
    queryKey: [symbolsQueryKey],
    enabled: open,
  });

  const filteredSymbols = useMemo(() => {
    if (!symbolSearch.trim()) return symbols;
    const search = symbolSearch.toUpperCase();
    return symbols.filter(s => 
      s.formatted.toUpperCase().includes(search) || 
      s.symbol.toUpperCase().includes(search)
    );
  }, [symbols, symbolSearch]);

  const enabledIndicatorsCount = [
    config.indicators.rsi.enabled,
    config.indicators.macd.enabled,
    config.indicators.bollingerBands.enabled,
    config.indicators.ema.enabled,
  ].filter(Boolean).length;

  const isValid = config.name.trim() !== "" && 
                  config.investment > 0 && 
                  enabledIndicatorsCount >= config.minSignals;

  const handleCreate = () => {
    if (onCreateBot && isValid) {
      onCreateBot(config);
      onOpenChange(false);
      setConfig({
        name: "",
        symbol: "BTC/USDT",
        investment: 100,
        stopLoss: 5,
        takeProfit: 10,
        indicators: defaultIndicators,
        minSignals: 2,
        interval: "1h",
      });
      setStep("basic");
      setSymbolSearch("");
    }
  };

  const handleSymbolSelect = (pair: TradingPair) => {
    setConfig({ ...config, symbol: pair.formatted });
    setSymbolPopoverOpen(false);
    setSymbolSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Criar Novo Robô de Trading
          </DialogTitle>
          <DialogDescription>
            Configure os parâmetros do seu robô de trading automatizado.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} onValueChange={(v) => setStep(v as typeof step)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" data-testid="tab-basic">
              1. Básico
            </TabsTrigger>
            <TabsTrigger value="indicators" data-testid="tab-indicators">
              2. Indicadores
            </TabsTrigger>
            <TabsTrigger value="risk" data-testid="tab-risk">
              3. Risco
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="botName">Nome do Robô</Label>
              <Input
                id="botName"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="Ex: BTC Scalper"
                data-testid="input-bot-name"
              />
            </div>

            <div className="space-y-2">
              <Label>Par de Trading</Label>
              <Popover open={symbolPopoverOpen} onOpenChange={setSymbolPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={symbolPopoverOpen}
                    className="w-full justify-between font-mono"
                    data-testid="select-symbol"
                  >
                    {config.symbol}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command shouldFilter={false}>
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <input
                        placeholder="Buscar par de trading..."
                        value={symbolSearch}
                        onChange={(e) => setSymbolSearch(e.target.value)}
                        className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        data-testid="input-symbol-search"
                      />
                    </div>
                    <CommandList>
                      {symbolsLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
                        </div>
                      ) : filteredSymbols.length === 0 ? (
                        <CommandEmpty>Nenhum par encontrado.</CommandEmpty>
                      ) : (
                        <CommandGroup className="max-h-64 overflow-auto">
                          {filteredSymbols.map((pair) => (
                            <CommandItem
                              key={pair.symbol}
                              value={pair.symbol}
                              onSelect={() => handleSymbolSelect(pair)}
                              className="cursor-pointer"
                              data-testid={`symbol-option-${pair.symbol}`}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  config.symbol === pair.formatted ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="font-mono">{pair.formatted}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Digite para buscar entre todos os pares disponíveis na Binance
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="investment">Investimento Inicial (USDT)</Label>
              <Input
                id="investment"
                type="number"
                value={config.investment}
                onChange={(e) => setConfig({ ...config, investment: parseFloat(e.target.value) || 0 })}
                className="font-mono"
                data-testid="input-investment"
              />
            </div>

            <div className="space-y-2">
              <Label>Intervalo de Análise</Label>
              <Select 
                value={config.interval} 
                onValueChange={(v) => setConfig({ ...config, interval: v })}
              >
                <SelectTrigger data-testid="select-interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 minuto (muito rápido)</SelectItem>
                  <SelectItem value="5m">5 minutos (rápido)</SelectItem>
                  <SelectItem value="15m">15 minutos (moderado)</SelectItem>
                  <SelectItem value="30m">30 minutos</SelectItem>
                  <SelectItem value="1h">1 hora (recomendado)</SelectItem>
                  <SelectItem value="4h">4 horas (lento)</SelectItem>
                  <SelectItem value="1d">1 dia (muito lento)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Com que frequência o robô irá analisar o mercado e tomar decisões
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep("indicators")} data-testid="button-next-indicators">
                Próximo: Indicadores
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="indicators" className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-muted/50 mb-4">
              <p className="text-sm text-muted-foreground">
                Selecione os indicadores técnicos que o robô usará para tomar decisões de compra e venda. 
                <span className="font-medium text-foreground"> O robô irá executar uma ordem quando {config.minSignals} ou mais indicadores concordarem.</span>
              </p>
            </div>

            <IndicatorConfig
              settings={config.indicators}
              onChange={(indicators) => setConfig({ ...config, indicators })}
            />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("basic")} data-testid="button-back-basic">
                Voltar
              </Button>
              <Button onClick={() => setStep("risk")} data-testid="button-next-risk">
                Próximo: Gerenciamento de Risco
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                <Input
                  id="stopLoss"
                  type="number"
                  step="0.5"
                  value={config.stopLoss}
                  onChange={(e) => setConfig({ ...config, stopLoss: parseFloat(e.target.value) || 0 })}
                  className="font-mono"
                  data-testid="input-stop-loss"
                />
                <p className="text-xs text-muted-foreground">
                  Vende automaticamente se o preço cair {config.stopLoss}%
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="takeProfit">Take Profit (%)</Label>
                <Input
                  id="takeProfit"
                  type="number"
                  step="0.5"
                  value={config.takeProfit}
                  onChange={(e) => setConfig({ ...config, takeProfit: parseFloat(e.target.value) || 0 })}
                  className="font-mono"
                  data-testid="input-take-profit"
                />
                <p className="text-xs text-muted-foreground">
                  Vende automaticamente se o preço subir {config.takeProfit}%
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sinais Mínimos para Operar</Label>
              <Select 
                value={config.minSignals.toString()} 
                onValueChange={(v) => setConfig({ ...config, minSignals: parseInt(v) })}
              >
                <SelectTrigger data-testid="select-min-signals">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 indicador (mais agressivo)</SelectItem>
                  <SelectItem value="2">2 indicadores (recomendado)</SelectItem>
                  <SelectItem value="3">3 indicadores (mais conservador)</SelectItem>
                  <SelectItem value="4">4 indicadores (muito conservador)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Atualmente {enabledIndicatorsCount} indicadores ativos
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card mt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Resumo da Configuração
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Nome:</span> {config.name || "-"}</div>
                <div><span className="text-muted-foreground">Par:</span> {config.symbol}</div>
                <div><span className="text-muted-foreground">Investimento:</span> ${config.investment}</div>
                <div><span className="text-muted-foreground">Intervalo:</span> {config.interval}</div>
                <div><span className="text-muted-foreground">Stop Loss:</span> {config.stopLoss}%</div>
                <div><span className="text-muted-foreground">Take Profit:</span> {config.takeProfit}%</div>
                <div><span className="text-muted-foreground">Indicadores:</span> {enabledIndicatorsCount} ativos</div>
                <div><span className="text-muted-foreground">Sinais Mínimos:</span> {config.minSignals}</div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("indicators")} data-testid="button-back-indicators">
                Voltar
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!isValid}
            className="bg-primary"
            data-testid="button-create-bot"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Robô
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
