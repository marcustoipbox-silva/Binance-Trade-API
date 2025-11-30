import { useState } from "react";
import { TradingChart } from "@/components/trading/TradingChart";
import { OrderBook } from "@/components/trading/OrderBook";
import { OrderForm } from "@/components/trading/OrderForm";
import { RecentTrades } from "@/components/trading/RecentTrades";
import { OrderHistory } from "@/components/trading/OrderHistory";
import { MarketSelector } from "@/components/trading/MarketSelector";

// todo: remove mock functionality
const mockMarkets = [
  { symbol: "BTC/USDT", name: "Bitcoin", price: "97.432,50", change24h: 2.34, isFavorite: true },
  { symbol: "ETH/USDT", name: "Ethereum", price: "3.456,78", change24h: -1.25, isFavorite: true },
  { symbol: "SOL/USDT", name: "Solana", price: "52,34", change24h: 5.67, isFavorite: false },
  { symbol: "BNB/USDT", name: "BNB", price: "234,56", change24h: 0.89, isFavorite: false },
  { symbol: "XRP/USDT", name: "Ripple", price: "0,5234", change24h: -2.10, isFavorite: false },
];

const mockChartData = Array.from({ length: 48 }, (_, i) => {
  const basePrice = 97000 + Math.random() * 1000;
  const volatility = 200;
  return {
    time: `${i % 24}:00`,
    open: basePrice,
    high: basePrice + Math.random() * volatility,
    low: basePrice - Math.random() * volatility,
    close: basePrice + (Math.random() - 0.5) * volatility,
  };
});

const mockAsks = [
  { price: "97.450,00", amount: "0,234", total: "22.803,30", percentage: 45 },
  { price: "97.448,50", amount: "0,156", total: "15.201,97", percentage: 30 },
  { price: "97.447,00", amount: "0,089", total: "8.672,78", percentage: 18 },
  { price: "97.445,50", amount: "0,432", total: "42.096,46", percentage: 85 },
  { price: "97.444,00", amount: "0,278", total: "27.089,43", percentage: 55 },
  { price: "97.442,50", amount: "0,167", total: "16.272,90", percentage: 32 },
];

const mockBids = [
  { price: "97.432,50", amount: "0,312", total: "30.398,94", percentage: 60 },
  { price: "97.431,00", amount: "0,198", total: "19.291,34", percentage: 38 },
  { price: "97.429,50", amount: "0,456", total: "44.427,85", percentage: 90 },
  { price: "97.428,00", amount: "0,134", total: "13.055,35", percentage: 26 },
  { price: "97.426,50", amount: "0,523", total: "50.954,06", percentage: 100 },
  { price: "97.425,00", amount: "0,267", total: "26.012,48", percentage: 52 },
];

const mockTrades = Array.from({ length: 20 }, (_, i) => ({
  id: `trade-${i}`,
  price: (97430 + Math.random() * 10).toFixed(2).replace('.', ','),
  amount: (Math.random() * 0.5).toFixed(4).replace('.', ','),
  side: Math.random() > 0.5 ? "buy" as const : "sell" as const,
  time: `12:${(30 + i).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
}));

const mockOpenOrders = [
  { id: "1", symbol: "BTC/USDT", side: "buy" as const, type: "Limite", price: "95.000,00", amount: "0,1234", filled: "0,0000", status: "open" as const, time: "12:34" },
];

const mockOrderHistory = [
  { id: "3", symbol: "BTC/USDT", side: "buy" as const, type: "Mercado", price: "97.432,50", amount: "0,0500", filled: "0,0500", status: "filled" as const, time: "10:15" },
];

export default function Trade() {
  const [selectedMarket, setSelectedMarket] = useState("BTC/USDT");
  const [markets, setMarkets] = useState(mockMarkets);

  const currentMarket = markets.find(m => m.symbol === selectedMarket) || markets[0];

  const toggleFavorite = (symbol: string) => {
    setMarkets(markets.map(m => 
      m.symbol === symbol ? { ...m, isFavorite: !m.isFavorite } : m
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <MarketSelector
            markets={markets}
            selectedMarket={selectedMarket}
            onSelectMarket={setSelectedMarket}
            onToggleFavorite={toggleFavorite}
          />
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold" data-testid="text-current-market-price">
              ${currentMarket.price}
            </span>
            <span className={`text-sm font-medium ${currentMarket.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {currentMarket.change24h >= 0 ? '+' : ''}{currentMarket.change24h.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-3 space-y-4">
          <OrderBook
            bids={mockBids}
            asks={mockAsks}
            symbol={selectedMarket}
            currentPrice={currentMarket.price}
          />
          <RecentTrades trades={mockTrades} symbol={selectedMarket} />
        </div>

        <div className="xl:col-span-6 space-y-4">
          <TradingChart
            symbol={selectedMarket}
            data={mockChartData}
            currentPrice={currentMarket.price}
            change24h={currentMarket.change24h}
          />
          <OrderHistory
            openOrders={mockOpenOrders}
            orderHistory={mockOrderHistory}
            onCancelOrder={(id) => console.log("Cancelar ordem:", id)}
          />
        </div>

        <div className="xl:col-span-3">
          <OrderForm
            symbol={selectedMarket}
            currentPrice={currentMarket.price}
            availableBalance="10.000,00"
            asset="USDT"
            onSubmit={(order) => console.log("Ordem enviada:", order)}
          />
        </div>
      </div>
    </div>
  );
}
