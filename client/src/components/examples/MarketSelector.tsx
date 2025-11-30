import { MarketSelector } from "../trading/MarketSelector";
import { useState } from "react";

export default function MarketSelectorExample() {
  // todo: remove mock functionality
  const [selectedMarket, setSelectedMarket] = useState("BTC/USDT");
  const [markets, setMarkets] = useState([
    { symbol: "BTC/USDT", name: "Bitcoin", price: "97,432.50", change24h: 2.34, isFavorite: true },
    { symbol: "ETH/USDT", name: "Ethereum", price: "3,456.78", change24h: -1.25, isFavorite: true },
    { symbol: "SOL/USDT", name: "Solana", price: "52.34", change24h: 5.67, isFavorite: false },
    { symbol: "BNB/USDT", name: "BNB", price: "234.56", change24h: 0.89, isFavorite: false },
    { symbol: "XRP/USDT", name: "Ripple", price: "0.5234", change24h: -2.10, isFavorite: false },
  ]);

  const toggleFavorite = (symbol: string) => {
    setMarkets(markets.map(m => 
      m.symbol === symbol ? { ...m, isFavorite: !m.isFavorite } : m
    ));
  };

  return (
    <MarketSelector
      markets={markets}
      selectedMarket={selectedMarket}
      onSelectMarket={setSelectedMarket}
      onToggleFavorite={toggleFavorite}
    />
  );
}
