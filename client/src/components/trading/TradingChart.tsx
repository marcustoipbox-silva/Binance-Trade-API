import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradingChartProps {
  symbol: string;
  data: CandleData[];
  currentPrice: string;
  change24h: number;
}

const timeframes = ["1m", "5m", "15m", "1h", "4h", "1D"];

export function TradingChart({ symbol, data, currentPrice, change24h }: TradingChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const isPositive = change24h >= 0;

  const maxPrice = Math.max(...data.map(d => d.high));
  const minPrice = Math.min(...data.map(d => d.low));
  const priceRange = maxPrice - minPrice;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg font-semibold" data-testid="text-chart-symbol">{symbol}</CardTitle>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold" data-testid="text-chart-price">${currentPrice}</span>
              <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{change24h.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                size="sm"
                variant={selectedTimeframe === tf ? "secondary" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setSelectedTimeframe(tf)}
                data-testid={`button-timeframe-${tf}`}
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-64 flex items-end gap-1" data-testid="chart-candlestick">
          {data.map((candle, i) => {
            const isGreen = candle.close >= candle.open;
            const bodyTop = ((maxPrice - Math.max(candle.open, candle.close)) / priceRange) * 100;
            const bodyHeight = (Math.abs(candle.close - candle.open) / priceRange) * 100;
            const wickTop = ((maxPrice - candle.high) / priceRange) * 100;
            const wickBottom = ((maxPrice - candle.low) / priceRange) * 100;
            
            return (
              <div 
                key={i} 
                className="flex-1 relative h-full"
                data-testid={`candle-${i}`}
              >
                <div 
                  className={`absolute left-1/2 w-px -translate-x-1/2 ${isGreen ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ 
                    top: `${wickTop}%`, 
                    height: `${wickBottom - wickTop}%` 
                  }}
                />
                <div 
                  className={`absolute left-0 right-0 mx-auto rounded-sm ${isGreen ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ 
                    top: `${bodyTop}%`, 
                    height: `${Math.max(bodyHeight, 1)}%`,
                    width: '70%'
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{data[0]?.time}</span>
          <span>{data[data.length - 1]?.time}</span>
        </div>
      </CardContent>
    </Card>
  );
}
