import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import type { Bot } from "@shared/schema";

interface Balance {
  asset: string;
  free: number;
  locked: number;
}

interface ConnectionStatus {
  connected: boolean;
  demoMode?: boolean;
  testnet?: boolean;
}

export function BalancePanel() {
  const { data: connectionStatus } = useQuery<ConnectionStatus>({
    queryKey: ["/api/binance/status"],
    refetchInterval: 30000,
  });

  const isConnected = connectionStatus?.connected && !connectionStatus?.demoMode;

  const { data: balances = [], isLoading, isError } = useQuery<Balance[]>({
    queryKey: ["/api/binance/balance"],
    refetchInterval: 10000,
    enabled: isConnected,
  });

  const { data: bots = [] } = useQuery<Bot[]>({
    queryKey: ["/api/bots"],
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/binance/balance"] });
  };

  const tradedAssets = bots
    .map(bot => bot.symbol.split('/')[0])
    .filter((asset, index, arr) => arr.indexOf(asset) === index);

  const mainAssets = ["USDT", ...tradedAssets, "BTC", "ETH", "BNB"];
  
  // Filtrar apenas ativos importantes (main + com saldo > 0)
  const importantBalances = balances.filter(b => 
    mainAssets.includes(b.asset) || (b.free + b.locked) > 0.001
  );
  
  const sortedBalances = [...importantBalances].sort((a, b) => {
    const aIndex = mainAssets.indexOf(a.asset);
    const bIndex = mainAssets.indexOf(b.asset);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return (b.free + b.locked) - (a.free + a.locked);
  });

  // Mostrar até 15 ativos, priorizando os negociados
  const displayBalances = sortedBalances.slice(0, 15);

  return (
    <Card data-testid="card-balance-panel">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Saldo da Conta
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh}
          data-testid="button-refresh-balance"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="text-center py-6 text-muted-foreground">
            <WifiOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">API Binance não conectada</p>
            <p className="text-xs mt-1">
              {connectionStatus?.demoMode 
                ? "Modo Demo não exibe saldo real" 
                : "Conecte sua API para ver o saldo"}
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Erro ao carregar saldo
          </p>
        ) : displayBalances.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum saldo disponível
          </p>
        ) : (
          <div className="space-y-2">
            {displayBalances.map((balance) => (
              <div 
                key={balance.asset}
                className="flex items-center justify-between py-1 border-b border-border/50 last:border-0"
                data-testid={`balance-row-${balance.asset}`}
              >
                <span className="font-medium text-sm">{balance.asset}</span>
                <div className="text-right">
                  <span className="font-mono text-sm" data-testid={`balance-free-${balance.asset}`}>
                    {balance.free.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 8 
                    })}
                  </span>
                  {balance.locked > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (bloq: {balance.locked.toLocaleString('pt-BR', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8 
                      })})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
