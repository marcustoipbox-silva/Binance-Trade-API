import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, Star } from "lucide-react";
import { useState } from "react";

interface Market {
  symbol: string;
  name: string;
  price: string;
  change24h: number;
  isFavorite?: boolean;
}

interface MarketSelectorProps {
  markets: Market[];
  selectedMarket: string;
  onSelectMarket: (symbol: string) => void;
  onToggleFavorite?: (symbol: string) => void;
}

export function MarketSelector({ markets, selectedMarket, onSelectMarket, onToggleFavorite }: MarketSelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = markets.find(m => m.symbol === selectedMarket);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="justify-between gap-2 min-w-[180px]"
          data-testid="button-market-selector"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-[8px] font-semibold text-primary">
                {selected?.symbol.slice(0, 2) || "??"}
              </span>
            </div>
            <span className="font-medium">{selected?.symbol || "Select Market"}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search markets..." data-testid="input-market-search" />
          <CommandList>
            <CommandEmpty>No markets found.</CommandEmpty>
            <CommandGroup heading="Markets">
              {markets.map((market) => {
                const isPositive = market.change24h >= 0;
                return (
                  <CommandItem
                    key={market.symbol}
                    value={market.symbol}
                    onSelect={() => {
                      onSelectMarket(market.symbol);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between py-2"
                    data-testid={`option-market-${market.symbol.toLowerCase().replace('/', '-')}`}
                  >
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite?.(market.symbol);
                        }}
                      >
                        <Star 
                          className={`h-3 w-3 ${market.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} 
                        />
                      </Button>
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-[8px] font-semibold text-primary">
                          {market.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{market.symbol}</p>
                        <p className="text-xs text-muted-foreground">{market.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">${market.price}</p>
                      <p className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{market.change24h.toFixed(2)}%
                      </p>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
