import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeyConfig } from "@/components/bot/ApiKeyConfig";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Palette,
  Globe,
  Save,
  Wallet,
  Loader2
} from "lucide-react";
import type { AccountBalance } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    trades: true,
    signals: true,
    errors: true,
    dailyReport: false,
  });
  const [riskSettings, setRiskSettings] = useState({
    maxDailyLoss: 500,
    maxPositionSize: 1000,
    emergencyStop: true,
  });

  const { data: connectionStatus } = useQuery<{ connected: boolean }>({
    queryKey: ["/api/binance/status"],
    refetchInterval: 30000,
  });

  const { data: balances, isLoading: balancesLoading } = useQuery<AccountBalance[]>({
    queryKey: ["/api/binance/balance"],
    enabled: !!connectionStatus?.connected,
    refetchInterval: 60000,
  });

  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "Suas preferências foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground">Gerencie suas preferências e configurações do sistema</p>
      </div>

      <Tabs defaultValue="api">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="api" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">API</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Risco</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="mt-6 space-y-6">
          <ApiKeyConfig />

          {connectionStatus?.connected && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Saldo da Conta
                </CardTitle>
                <CardDescription>Seus ativos disponíveis na Binance</CardDescription>
              </CardHeader>
              <CardContent>
                {balancesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : balances && balances.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {balances.slice(0, 9).map((balance) => (
                      <div 
                        key={balance.asset} 
                        className="p-3 rounded-lg bg-muted/50"
                        data-testid={`balance-${balance.asset}`}
                      >
                        <p className="font-medium">{balance.asset}</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {balance.free.toFixed(8)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum ativo encontrado
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Preferências de Notificação
              </CardTitle>
              <CardDescription>Configure como você deseja receber alertas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificações de Trades</Label>
                  <p className="text-xs text-muted-foreground">Receba alertas quando uma operação for executada</p>
                </div>
                <Switch 
                  checked={notifications.trades}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, trades: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Alertas de Sinais</Label>
                  <p className="text-xs text-muted-foreground">Notificações quando indicadores detectarem sinais</p>
                </div>
                <Switch 
                  checked={notifications.signals}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, signals: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Alertas de Erro</Label>
                  <p className="text-xs text-muted-foreground">Notificações quando houver erros no sistema</p>
                </div>
                <Switch 
                  checked={notifications.errors}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, errors: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Relatório Diário</Label>
                  <p className="text-xs text-muted-foreground">Receba um resumo diário por email</p>
                </div>
                <Switch 
                  checked={notifications.dailyReport}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, dailyReport: checked })}
                />
              </div>

              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Preferências
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gerenciamento de Risco</CardTitle>
              <CardDescription>Configure limites para proteger seu capital</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Perda Diária Máxima (USDT)</Label>
                <Input
                  type="number"
                  value={riskSettings.maxDailyLoss}
                  onChange={(e) => setRiskSettings({ ...riskSettings, maxDailyLoss: parseFloat(e.target.value) })}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">Todos os robôs serão pausados se a perda diária atingir este valor</p>
              </div>

              <div className="space-y-2">
                <Label>Tamanho Máximo por Posição (USDT)</Label>
                <Input
                  type="number"
                  value={riskSettings.maxPositionSize}
                  onChange={(e) => setRiskSettings({ ...riskSettings, maxPositionSize: parseFloat(e.target.value) })}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">Limite máximo para cada operação individual</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Parada de Emergência</Label>
                  <p className="text-xs text-muted-foreground">Pause todos os robôs em caso de volatilidade extrema</p>
                </div>
                <Switch 
                  checked={riskSettings.emergencyStop}
                  onCheckedChange={(checked) => setRiskSettings({ ...riskSettings, emergencyStop: checked })}
                />
              </div>

              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações de Risco
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Aparência
              </CardTitle>
              <CardDescription>Personalize a interface do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Select defaultValue="pt-BR">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tema</Label>
                <Select defaultValue="dark">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Formato de Número</Label>
                <Select defaultValue="pt-BR">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">1.234,56 (Brasil)</SelectItem>
                    <SelectItem value="en-US">1,234.56 (EUA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Aparência
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
