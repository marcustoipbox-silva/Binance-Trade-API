import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceCardProps {
  symbol: string;
  name: string;
  price: string;
  change24h: number;
  volume: string;
  onClick?: () => void;
}

export function PriceCard({ symbol, name, price, change24h, volume, onClick }: PriceCardProps) {
  const isPositive = change24h >= 0;

  return (
    <Card 
      className="hover-elevate cursor-pointer" 
      onClick={onClick}
      data-testid={`card-price-${symbol.toLowerCase()}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">{symbol.slice(0, 2)}</span>
            </div>
            <div>
              <p className="font-semibold text-sm" data-testid={`text-symbol-${symbol.toLowerCase()}`}>{symbol}</p>
              <p className="text-xs text-muted-foreground">{name}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span data-testid={`text-change-${symbol.toLowerCase()}`}>{isPositive ? '+' : ''}{change24h.toFixed(2)}%</span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2">
          <p className="text-lg font-mono font-semibold" data-testid={`text-price-${symbol.toLowerCase()}`}>${price}</p>
          <p className="text-xs text-muted-foreground">Vol: {volume}</p>
        </div>
      </CardContent>
    </Card>
  );
}
