import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Eye, EyeOff, Shield, Check, X, Loader2, Play, Globe, FlaskConical, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function ApiKeyConfig() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [useTestnet, setUseTestnet] = useState(true);

  const { data: status, isLoading: statusLoading } = useQuery<{ connected: boolean; message?: string; demoMode?: boolean; testnet?: boolean }>({
    queryKey: ["/api/binance/status"],
    refetchInterval: 30000,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/binance/connect", { apiKey, secretKey, testnet: useTestnet });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/binance/status"] });
      toast({ title: "Conectado!", description: "API Binance conectada com sucesso." });
      setApiKey("");
      setSecretKey("");
    },
    onError: (error: Error) => {
      toast({ title: "Erro de conexão", description: error.message, variant: "destructive" });
    },
  });

  const demoModeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/binance/demo-mode", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/binance/status"] });
      toast({ title: "Modo Demo Ativado!", description: "Você pode explorar todas as funcionalidades com dados simulados." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const disableDemoMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/binance/disable-demo", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/binance/status"] });
      toast({ title: "Modo Demo Desativado", description: "Você pode agora conectar sua conta Binance." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/binance/disconnect", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/binance/status"] });
      toast({ title: "Desconectado", description: "Conexão com a Binance encerrada." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const isConnected = status?.connected;
  const isDemoMode = status?.demoMode;
  const isTestnet = status?.testnet;
  const hasGeoRestriction = status?.message?.includes("restricted location");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Configuração da API Binance</CardTitle>
              <CardDescription>Conecte sua conta Binance para trading automatizado</CardDescription>
            </div>
          </div>
          <Badge 
            variant="secondary"
            className={
              isDemoMode 
                ? "bg-blue-500/10 text-blue-500" 
                : isTestnet && isConnected
                  ? "bg-yellow-500/10 text-yellow-500"
                  : isConnected 
                    ? "bg-green-500/10 text-green-500" 
                    : "bg-red-500/10 text-red-500"
            }
            data-testid="badge-connection-status"
          >
            {statusLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isDemoMode ? (
              <>
                <Play className="h-3 w-3 mr-1" />
                Modo Demo
              </>
            ) : isTestnet && isConnected ? (
              <>
                <FlaskConical className="h-3 w-3 mr-1" />
                Testnet
              </>
            ) : isConnected ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Conectado
              </>
            ) : (
              <>
                <X className="h-3 w-3 mr-1" />
                Desconectado
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasGeoRestriction && !isDemoMode && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20">
            <Globe className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <div className="text-xs text-red-400">
              <p className="font-medium mb-1">Restrição Geográfica (Produção e Testnet)</p>
              <p>A Binance bloqueia TODA a API (produção e testnet) a partir dos servidores do Replit.</p>
              <ul className="list-disc list-inside space-y-0.5 mt-1">
                <li><strong>Use o Modo Demo</strong> para testar todas as funcionalidades</li>
                <li>Para trading real, execute em um VPS próprio sem restrição</li>
              </ul>
            </div>
          </div>
        )}

        {isDemoMode ? (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
              <Play className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium text-blue-500">Modo Demonstração Ativo</p>
                <p className="text-sm text-muted-foreground">
                  O sistema está operando com dados simulados. Crie robôs e explore todas as funcionalidades!
                </p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => disableDemoMutation.mutate()}
              disabled={disableDemoMutation.isPending}
              className="w-full"
              data-testid="button-disable-demo"
            >
              {disableDemoMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Desativando...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Desativar Modo Demo
                </>
              )}
            </Button>
          </div>
        ) : isConnected ? (
          <div className="space-y-3">
            <div className={`p-4 rounded-lg flex items-center gap-3 ${isTestnet ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-muted/50"}`}>
              {isTestnet ? (
                <FlaskConical className="h-8 w-8 text-yellow-500" />
              ) : (
                <Shield className="h-8 w-8 text-green-500" />
              )}
              <div>
                <p className={`font-medium ${isTestnet ? "text-yellow-500" : "text-green-500"}`}>
                  {isTestnet ? "Testnet Conectada" : "Conexão ativa"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isTestnet 
                    ? "Ambiente de testes ativo. Use fundos fictícios para testar suas estratégias."
                    : "Sua conta Binance está conectada e pronta para operar."
                  }
                </p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="w-full"
              data-testid="button-disconnect"
            >
              {disconnectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Desconectando...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Desconectar
                </>
              )}
            </Button>
          </div>
        ) : !hasGeoRestriction ? (
          <>
            <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              <div className="text-xs text-yellow-600 dark:text-yellow-400">
                <p className="font-medium mb-1">Importante:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Nunca compartilhe suas chaves API</li>
                  <li>Use apenas permissões de trading (spot)</li>
                  <li>NÃO habilite permissões de saque</li>
                  <li>Restrinja o acesso por IP se possível</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-sm">Chave API</Label>
                <Input
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Digite sua chave API da Binance"
                  className="font-mono text-sm"
                  data-testid="input-api-key"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretKey" className="text-sm">Chave Secreta</Label>
                <div className="relative">
                  <Input
                    id="secretKey"
                    type={showSecret ? "text" : "password"}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Digite sua chave secreta"
                    className="font-mono text-sm pr-10"
                    data-testid="input-secret-key"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full w-10"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-yellow-500" />
                  <div>
                    <Label htmlFor="testnet-switch" className="text-sm font-medium cursor-pointer">
                      Usar Testnet
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Ambiente de testes com fundos fictícios (recomendado)
                    </p>
                  </div>
                </div>
                <Switch
                  id="testnet-switch"
                  checked={useTestnet}
                  onCheckedChange={setUseTestnet}
                  data-testid="switch-testnet"
                />
              </div>
            </div>
          </>
        ) : null}

        {!isConnected && !isDemoMode && (
          <>
            {hasGeoRestriction ? (
              /* When geo-restricted, show Demo Mode as primary option */
              <div className="flex flex-col gap-3 pt-2">
                <Button 
                  onClick={() => demoModeMutation.mutate()}
                  disabled={demoModeMutation.isPending}
                  className="w-full"
                  data-testid="button-demo-mode"
                >
                  {demoModeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ativando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Usar Modo Demo (Recomendado)
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  O Modo Demo simula o ambiente completo de trading, permitindo que você explore todas as funcionalidades sem restrições.
                </p>
              </div>
            ) : (
              /* When not geo-restricted, show full connection form */
              <>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Como obter suas chaves {useTestnet ? "(Testnet)" : ""}:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    {useTestnet ? (
                      <>
                        <li>Acesse <a href="https://testnet.binance.vision/" target="_blank" rel="noopener noreferrer" className="text-primary underline">testnet.binance.vision</a></li>
                        <li>Faça login com sua conta GitHub</li>
                        <li>Clique em "Generate HMAC_SHA256 Key"</li>
                        <li>Copie a API Key e Secret Key geradas</li>
                      </>
                    ) : (
                      <>
                        <li>Acesse sua conta Binance</li>
                        <li>Vá em Gerenciamento de API</li>
                        <li>Crie uma nova chave API com permissão de trading spot</li>
                        <li>Copie e cole as chaves aqui</li>
                      </>
                    )}
                  </ol>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button 
                    onClick={() => connectMutation.mutate()}
                    disabled={!apiKey || !secretKey || connectMutation.isPending}
                    className="w-full"
                    data-testid="button-connect-api"
                  >
                    {connectMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Conectando...
                      </>
                    ) : useTestnet ? (
                      <>
                        <FlaskConical className="h-4 w-4 mr-2" />
                        Conectar ao Testnet
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Conectar à Binance
                      </>
                    )}
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-muted" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline"
                    onClick={() => demoModeMutation.mutate()}
                    disabled={demoModeMutation.isPending}
                    className="w-full"
                    data-testid="button-demo-mode"
                  >
                    {demoModeMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Ativando...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Usar Modo Demo
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
