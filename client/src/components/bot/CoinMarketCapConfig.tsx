import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Check, X, Loader2, TrendingDown, ExternalLink, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CoinMarketCapStatus {
  configured: boolean;
  maskedKey: string | null;
}

export function CoinMarketCapConfig() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const { data: status, isLoading: statusLoading } = useQuery<CoinMarketCapStatus>({
    queryKey: ["/api/settings/coinmarketcap"],
    refetchInterval: 30000,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/settings/coinmarketcap", { apiKey });
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/settings/coinmarketcap"] });
      await queryClient.refetchQueries({ queryKey: ["/api/fear-greed"] });
      toast({ title: "Configurado!", description: "Chave CoinMarketCap salva com sucesso." });
      setApiKey("");
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/settings/coinmarketcap", {});
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/settings/coinmarketcap"] });
      await queryClient.refetchQueries({ queryKey: ["/api/fear-greed"] });
      toast({ title: "Removida", description: "Chave CoinMarketCap removida." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const isConfigured = status?.configured;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-orange-500" />
            <div>
              <CardTitle className="text-base">Fear & Greed Index (CoinMarketCap)</CardTitle>
              <CardDescription>Configure a chave da API para o indicador de Medo e Ganância</CardDescription>
            </div>
          </div>
          <Badge 
            variant="secondary"
            className={isConfigured ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}
            data-testid="badge-coinmarketcap-status"
          >
            {statusLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isConfigured ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Configurada
              </>
            ) : (
              <>
                <X className="h-3 w-3 mr-1" />
                Não configurada
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConfigured ? (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-green-500" />
              <div className="flex-1">
                <p className="font-medium text-green-500" data-testid="text-coinmarketcap-configured">API Configurada</p>
                <p className="text-sm text-muted-foreground font-mono select-none" data-testid="text-coinmarketcap-masked">
                  ••••••••••••••••
                </p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => removeMutation.mutate()}
              disabled={removeMutation.isPending}
              className="w-full"
              data-testid="button-remove-coinmarketcap"
            >
              {removeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover Chave
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2 p-3 rounded-md bg-orange-500/10 border border-orange-500/20">
              <TrendingDown className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
              <div className="text-xs text-orange-600 dark:text-orange-400">
                <p className="font-medium mb-1">Sobre o Fear & Greed Index:</p>
                <p>Este indicador mede o sentimento do mercado de criptomoedas (0-100). Valores baixos indicam medo extremo (oportunidade de compra), valores altos indicam ganância (possível venda).</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="cmcApiKey" className="text-sm">Chave API CoinMarketCap</Label>
                <div className="relative">
                  <Input
                    id="cmcApiKey"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Digite sua chave API"
                    className="font-mono text-sm pr-10"
                    data-testid="input-coinmarketcap-key"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full w-10"
                    onClick={() => setShowKey(!showKey)}
                    data-testid="button-toggle-coinmarketcap-visibility"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Como obter sua chave gratuita:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>
                  Acesse{" "}
                  <a 
                    href="https://coinmarketcap.com/api/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary underline inline-flex items-center gap-1"
                    data-testid="link-coinmarketcap-api"
                  >
                    coinmarketcap.com/api
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Clique em "GET YOUR FREE API KEY"</li>
                <li>Crie uma conta gratuita (plano Basic)</li>
                <li>Copie a chave da sua dashboard</li>
              </ol>
              <p className="mt-2 text-yellow-600 dark:text-yellow-400">
                O plano gratuito inclui 10.000 chamadas/mês - suficiente para uso pessoal.
              </p>
            </div>

            <Button 
              onClick={() => saveMutation.mutate()}
              disabled={!apiKey || apiKey.length < 10 || saveMutation.isPending}
              className="w-full"
              data-testid="button-save-coinmarketcap"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Salvar Chave
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
