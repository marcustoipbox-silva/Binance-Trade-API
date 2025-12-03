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
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bot, Save, TrendingUp, ChevronsUpDown, Check, Search, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { BotWithStats } from "@shared/schema";
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

interface EditBotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  botId: string | null;
}

interface BotConfig {
  name: string;
  symbol: string;
  investment: number;
  stopLoss: number;
  takeProfit: number;
  trailingStopPercent: number;
  cooldownMinutes: number;
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

export function EditBotModal({ open, onOpenChange, botId }: EditBotModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"basic" | "indicators" | "risk">("basic");
  const [symbolSearch, setSymbolSearch] = useState("");
  const [symbolPopoverOpen, setSymbolPopoverOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [config, setConfig] = useState<BotConfig>({
    name: "",
    symbol: "BTC/USDT",
    investment: 100,
    stopLoss: 5,
    takeProfit: 10,
    trailingStopPercent: 0,
    cooldownMinutes: 5,
    indicators: defaultIndicators,
    minSignals: 2,
    interval: "1h",
  });

  const { data: bot, isLoading: botLoading } = useQuery<BotWithStats>({
    queryKey: ["/api/bots", botId],
    enabled: !!botId && open,
  });

  useEffect(() => {
    if (bot) {
      setConfig({
        name: bot.name,
        symbol: bot.symbol,
        investment: bot.investment,
        stopLoss: bot.stopLoss,
        takeProfit: bot.takeProfit,
        trailingStopPercent: (bot as any).trailingStopPercent || 0,
        cooldownMinutes: (bot as any).cooldownMinutes || 5,
        indicators: bot.indicators as IndicatorSettings || defaultIndicators,
        minSignals: bot.minSignals,
        interval: bot.interval || "1h",
      });
    }
  }, [bot]);

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

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<BotConfig>) => {
      return apiRequest("PATCH", `/api/bots/${botId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Robô atualizado!", description: "As configurações foram salvas." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/bots/${botId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Robô excluído", description: "O robô foi removido com sucesso." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const enabledIndicatorsCount = [
    config.indicators.rsi.enabled,
    config.indicators.macd.enabled,
    config.indicators.bollingerBands.enabled,
    config.indicators.ema.enabled,
  ].filter(Boolean).length;

  const isValid = config.name.trim() !== "" && 
                  config.investment > 0 && 
                  enabledIndicatorsCount >= config.minSignals;

  const handleSave = () => {
    if (isValid) {
      updateMutation.mutate({
        name: config.name,
        symbol: config.symbol,
        investment: config.investment,
        stopLoss: config.stopLoss,
        takeProfit: config.takeProfit,
        trailingStopPercent: config.trailingStopPercent,
        cooldownMinutes: config.cooldownMinutes,
        indicators: config.indicators,
        minSignals: config.minSignals,
        interval: config.interval,
      });
    }
  };

  const handleSymbolSelect = (pair: TradingPair) => {
    setConfig({ ...config, symbol: pair.formatted });
    setSymbolPopoverOpen(false);
    setSymbolSearch("");
  };

  if (botLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Configurar Robô: {config.name}
            </DialogTitle>
            <DialogDescription>
              Ajuste os parâmetros do seu robô de trading.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={step} onValueChange={(v) => setStep(v as typeof step)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" data-testid="tab-edit-basic">
                1. Básico
              </TabsTrigger>
              <TabsTrigger value="indicators" data-testid="tab-edit-indicators">
                2. Indicadores
              </TabsTrigger>
              <TabsTrigger value="risk" data-testid="tab-edit-risk">
                3. Risco
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editBotName">Nome do Robô</Label>
                <Input
                  id="editBotName"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="Ex: BTC Scalper"
                  data-testid="input-edit-bot-name"
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
                      data-testid="select-edit-symbol"
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
                          data-testid="input-edit-symbol-search"
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="editInvestment">Investimento (USDT)</Label>
                <Input
                  id="editInvestment"
                  type="number"
                  value={config.investment}
                  onChange={(e) => setConfig({ ...config, investment: parseFloat(e.target.value) || 0 })}
                  className="font-mono"
                  data-testid="input-edit-investment"
                />
              </div>

              <div className="space-y-2">
                <Label>Intervalo de Análise</Label>
                <Select 
                  value={config.interval} 
                  onValueChange={(v) => setConfig({ ...config, interval: v })}
                >
                  <SelectTrigger data-testid="select-edit-interval">
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
                <Button onClick={() => setStep("indicators")} data-testid="button-edit-next-indicators">
                  Próximo: Indicadores
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="indicators" className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-muted/50 mb-4">
                <p className="text-sm text-muted-foreground">
                  Selecione os indicadores técnicos que o robô usará para tomar decisões. 
                  <span className="font-medium text-foreground"> O robô irá executar uma ordem quando {config.minSignals} ou mais indicadores concordarem.</span>
                </p>
              </div>

              <IndicatorConfig
                settings={config.indicators}
                onChange={(indicators) => setConfig({ ...config, indicators })}
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("basic")} data-testid="button-edit-back-basic">
                  Voltar
                </Button>
                <Button onClick={() => setStep("risk")} data-testid="button-edit-next-risk">
                  Próximo: Gerenciamento de Risco
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="risk" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editStopLoss">Stop Loss (%)</Label>
                  <Input
                    id="editStopLoss"
                    type="number"
                    step="0.5"
                    value={config.stopLoss}
                    onChange={(e) => setConfig({ ...config, stopLoss: parseFloat(e.target.value) || 0 })}
                    className="font-mono"
                    data-testid="input-edit-stop-loss"
                  />
                  <p className="text-xs text-muted-foreground">
                    Vende automaticamente se o preço cair {config.stopLoss}%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editTakeProfit">Take Profit (%)</Label>
                  <Input
                    id="editTakeProfit"
                    type="number"
                    step="0.5"
                    value={config.takeProfit}
                    onChange={(e) => setConfig({ ...config, takeProfit: parseFloat(e.target.value) || 0 })}
                    className="font-mono"
                    data-testid="input-edit-take-profit"
                  />
                  <p className="text-xs text-muted-foreground">
                    Vende automaticamente se o preço subir {config.takeProfit}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editTrailingStop">Trailing Stop (%)</Label>
                  <Input
                    id="editTrailingStop"
                    type="number"
                    step="0.5"
                    min="0"
                    value={config.trailingStopPercent}
                    onChange={(e) => setConfig({ ...config, trailingStopPercent: parseFloat(e.target.value) || 0 })}
                    className="font-mono"
                    data-testid="input-edit-trailing-stop"
                  />
                  <p className="text-xs text-muted-foreground">
                    {config.trailingStopPercent > 0 
                      ? `Protege lucros: vende se cair ${config.trailingStopPercent}% do máximo`
                      : "0 = desativado"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editCooldown">Cooldown (minutos)</Label>
                  <Input
                    id="editCooldown"
                    type="number"
                    step="1"
                    min="0"
                    value={config.cooldownMinutes}
                    onChange={(e) => setConfig({ ...config, cooldownMinutes: parseInt(e.target.value) || 0 })}
                    className="font-mono"
                    data-testid="input-edit-cooldown"
                  />
                  <p className="text-xs text-muted-foreground">
                    Aguarda {config.cooldownMinutes} min após venda antes de comprar
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sinais Mínimos para Operar</Label>
                <Select 
                  value={config.minSignals.toString()} 
                  onValueChange={(v) => setConfig({ ...config, minSignals: parseInt(v) })}
                >
                  <SelectTrigger data-testid="select-edit-min-signals">
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

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Prioridade de Venda:</p>
                <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Stop Loss (proteção contra perdas)</li>
                  <li>Take Profit (realização de lucros)</li>
                  <li>Trailing Stop (proteção de lucros em alta)</li>
                  <li>Indicadores de sobrecompra (RSI, etc.)</li>
                </ol>
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
                  <div><span className="text-muted-foreground">Trailing Stop:</span> {config.trailingStopPercent > 0 ? `${config.trailingStopPercent}%` : "Desativado"}</div>
                  <div><span className="text-muted-foreground">Cooldown:</span> {config.cooldownMinutes} min</div>
                  <div><span className="text-muted-foreground">Indicadores:</span> {enabledIndicatorsCount} ativos</div>
                  <div><span className="text-muted-foreground">Sinais Mínimos:</span> {config.minSignals}</div>
                </div>
              </div>

              {bot?.status === 'active' && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-yellow-500">
                    ⚠️ As alterações serão aplicadas imediatamente. Se o intervalo foi alterado, o robô usará a nova frequência no próximo ciclo.
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("indicators")} data-testid="button-edit-back-indicators">
                  Voltar
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="destructive" 
              onClick={() => setDeleteDialogOpen(true)}
              className="sm:mr-auto"
              data-testid="button-delete-bot"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Robô
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!isValid || updateMutation.isPending}
              className="bg-primary"
              data-testid="button-save-bot"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir robô?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O robô "{config.name}" será permanentemente removido do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
