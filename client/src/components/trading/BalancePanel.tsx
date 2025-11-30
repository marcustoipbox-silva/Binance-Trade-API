import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

interface Asset {
  symbol: string;
  name: string;
  balance: string;
  valueUSD: string;
  change24h: number;
}

interface BalancePanelProps {
  totalBalance: string;
  change24h: number;
  assets: Asset[];
}

export function BalancePanel({ totalBalance, change24h, assets }: BalancePanelProps) {
  const isPositive = change24h >= 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-md bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
          <p className="text-2xl font-mono font-bold" data-testid="text-total-balance">${totalBalance}</p>
          <div className={`flex items-center gap-1 mt-1 text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span data-testid="text-portfolio-change">{isPositive ? '+' : ''}{change24h.toFixed(2)}% (24h)</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Assets</p>
          {assets.map((asset) => {
            const assetPositive = asset.change24h >= 0;
            return (
              <div 
                key={asset.symbol} 
                className="flex items-center justify-between py-2 border-b last:border-0"
                data-testid={`row-asset-${asset.symbol.toLowerCase()}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-primary">{asset.symbol.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{asset.symbol}</p>
                    <p className="text-xs text-muted-foreground">{asset.balance}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono">${asset.valueUSD}</p>
                  <Badge 
                    variant="secondary" 
                    className={`text-[10px] px-1.5 py-0 ${assetPositive ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {assetPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
