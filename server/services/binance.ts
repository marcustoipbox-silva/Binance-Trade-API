import { MainClient, WebsocketClient, OrderSide, OrderType } from "binance";
import type { Candle, MarketData, AccountBalance } from "@shared/schema";

let mainClient: MainClient | null = null;
let wsClient: WebsocketClient | null = null;
let demoMode = false;
let testnetMode = false;

export function setDemoMode(enabled: boolean): void {
  demoMode = enabled;
  if (enabled) {
    testnetMode = false;
  }
}

export function isDemoMode(): boolean {
  return demoMode;
}

export function setTestnetMode(enabled: boolean): void {
  testnetMode = enabled;
}

export function isTestnetMode(): boolean {
  return testnetMode;
}

interface BinanceConfig {
  apiKey: string;
  secretKey: string;
  testnet?: boolean;
}

export function initializeBinanceClient(config: BinanceConfig): boolean {
  try {
    const useTestnet = config.testnet === true;
    testnetMode = useTestnet;
    demoMode = false;
    
    mainClient = new MainClient({
      api_key: config.apiKey,
      api_secret: config.secretKey,
      useTestnet: useTestnet,
    });
    
    wsClient = new WebsocketClient({
      api_key: config.apiKey,
      api_secret: config.secretKey,
      beautify: true,
      wsUrl: useTestnet ? "wss://testnet.binance.vision" : undefined,
    });
    
    console.log(`Binance client initialized in ${useTestnet ? "TESTNET" : "PRODUCTION"} mode`);
    return true;
  } catch (error) {
    console.error("Failed to initialize Binance client:", error);
    return false;
  }
}

export function isConnected(): boolean {
  return mainClient !== null;
}

export function getMainClient(): MainClient | null {
  return mainClient;
}

export async function testConnection(): Promise<{ success: boolean; message: string }> {
  if (!mainClient) {
    return { success: false, message: "Cliente Binance não inicializado" };
  }

  try {
    await mainClient.getServerTime();
    return { success: true, message: "Conexão estabelecida com sucesso" };
  } catch (error: any) {
    return { success: false, message: error.message || "Falha na conexão" };
  }
}

export async function getAccountBalance(): Promise<AccountBalance[]> {
  if (!mainClient) {
    throw new Error("Cliente Binance não inicializado");
  }

  try {
    const account = await mainClient.getAccountInformation();
    return account.balances
      .filter((b) => parseFloat(String(b.free)) > 0 || parseFloat(String(b.locked)) > 0)
      .map((b) => ({
        asset: b.asset,
        free: parseFloat(String(b.free)),
        locked: parseFloat(String(b.locked)),
      }));
  } catch (error: any) {
    console.error("Error getting account balance:", error);
    throw new Error(error.message || "Falha ao obter saldo");
  }
}

export async function getPrice(symbol: string): Promise<number> {
  if (!mainClient) {
    throw new Error("Cliente Binance não inicializado");
  }

  try {
    const ticker = await mainClient.getSymbolPriceTicker({ symbol: symbol.replace("/", "") });
    if (Array.isArray(ticker)) {
      return parseFloat(String(ticker[0].price));
    }
    return parseFloat(String(ticker.price));
  } catch (error: any) {
    console.error("Error getting price:", error);
    throw new Error(error.message || "Falha ao obter preço");
  }
}

export async function get24hTicker(symbol: string): Promise<MarketData> {
  if (!mainClient) {
    throw new Error("Cliente Binance não inicializado");
  }

  try {
    const formattedSymbol = symbol.replace("/", "");
    const ticker = await mainClient.get24hrChangeStatistics({ symbol: formattedSymbol });
    
    if (Array.isArray(ticker)) {
      const t = ticker[0] as any;
      return {
        symbol,
        price: parseFloat(String(t.lastPrice)),
        change24h: parseFloat(String(t.priceChangePercent || 0)),
        volume: String(t.volume),
        high24h: parseFloat(String(t.highPrice)),
        low24h: parseFloat(String(t.lowPrice)),
      };
    }
    
    const t = ticker as any;
    return {
      symbol,
      price: parseFloat(String(t.lastPrice)),
      change24h: parseFloat(String(t.priceChangePercent || 0)),
      volume: String(t.volume),
      high24h: parseFloat(String(t.highPrice)),
      low24h: parseFloat(String(t.lowPrice)),
    };
  } catch (error: any) {
    console.error("Error getting 24h ticker:", error);
    throw new Error(error.message || "Falha ao obter dados de mercado");
  }
}

export async function getCandles(
  symbol: string,
  interval: string = "1h",
  limit: number = 100
): Promise<Candle[]> {
  if (!mainClient) {
    throw new Error("Cliente Binance não inicializado");
  }

  try {
    const formattedSymbol = symbol.replace("/", "");
    const klines = await mainClient.getKlines({
      symbol: formattedSymbol,
      interval: interval as any,
      limit,
    });

    return klines.map((k: any) => ({
      time: typeof k[0] === 'number' ? k[0] : parseInt(k[0]),
      open: parseFloat(String(k[1])),
      high: parseFloat(String(k[2])),
      low: parseFloat(String(k[3])),
      close: parseFloat(String(k[4])),
      volume: parseFloat(String(k[5])),
    }));
  } catch (error: any) {
    console.error("Error getting candles:", error);
    throw new Error(error.message || "Falha ao obter candles");
  }
}

export async function placeMarketOrder(
  symbol: string,
  side: "BUY" | "SELL",
  quantity: number
): Promise<any> {
  if (!mainClient) {
    throw new Error("Cliente Binance não inicializado");
  }

  try {
    const formattedSymbol = symbol.replace("/", "");
    const order = await mainClient.submitNewOrder({
      symbol: formattedSymbol,
      side: side as OrderSide,
      type: "MARKET" as OrderType,
      quantity: quantity,
    });
    
    return order;
  } catch (error: any) {
    console.error("Error placing market order:", error);
    throw new Error(error.message || "Falha ao executar ordem");
  }
}

export async function placeLimitOrder(
  symbol: string,
  side: "BUY" | "SELL",
  quantity: number,
  price: number
): Promise<any> {
  if (!mainClient) {
    throw new Error("Cliente Binance não inicializado");
  }

  try {
    const formattedSymbol = symbol.replace("/", "");
    const order = await mainClient.submitNewOrder({
      symbol: formattedSymbol,
      side: side as OrderSide,
      type: "LIMIT" as OrderType,
      quantity: quantity,
      price: price,
      timeInForce: "GTC",
    });
    
    return order;
  } catch (error: any) {
    console.error("Error placing limit order:", error);
    throw new Error(error.message || "Falha ao executar ordem limite");
  }
}

export async function getOpenOrders(symbol?: string): Promise<any[]> {
  if (!mainClient) {
    throw new Error("Cliente Binance não inicializado");
  }

  try {
    const params = symbol ? { symbol: symbol.replace("/", "") } : undefined;
    const orders = await mainClient.getOpenOrders(params);
    return orders;
  } catch (error: any) {
    console.error("Error getting open orders:", error);
    throw new Error(error.message || "Falha ao obter ordens abertas");
  }
}

export async function cancelOrder(symbol: string, orderId: number): Promise<any> {
  if (!mainClient) {
    throw new Error("Cliente Binance não inicializado");
  }

  try {
    const result = await mainClient.cancelOrder({
      symbol: symbol.replace("/", ""),
      orderId,
    });
    return result;
  } catch (error: any) {
    console.error("Error canceling order:", error);
    throw new Error(error.message || "Falha ao cancelar ordem");
  }
}

export async function getExchangeInfo(symbol?: string): Promise<any> {
  if (!mainClient) {
    throw new Error("Cliente Binance não inicializado");
  }

  try {
    const info = await mainClient.getExchangeInfo();
    if (symbol) {
      const formattedSymbol = symbol.replace("/", "");
      return info.symbols.find((s) => s.symbol === formattedSymbol);
    }
    return info;
  } catch (error: any) {
    console.error("Error getting exchange info:", error);
    throw new Error(error.message || "Falha ao obter informações da exchange");
  }
}

export async function getSymbolMinQuantity(symbol: string): Promise<{ minQty: number; stepSize: number; minNotional: number }> {
  if (!mainClient) {
    throw new Error("Cliente Binance não inicializado");
  }

  try {
    const info = await getExchangeInfo(symbol);
    if (!info) {
      throw new Error("Símbolo não encontrado");
    }

    const lotSizeFilter = info.filters.find((f: any) => f.filterType === "LOT_SIZE");
    const notionalFilter = info.filters.find((f: any) => f.filterType === "NOTIONAL" || f.filterType === "MIN_NOTIONAL");

    return {
      minQty: parseFloat(lotSizeFilter?.minQty || "0.00001"),
      stepSize: parseFloat(lotSizeFilter?.stepSize || "0.00001"),
      minNotional: parseFloat(notionalFilter?.minNotional || "10"),
    };
  } catch (error: any) {
    console.error("Error getting symbol min quantity:", error);
    throw new Error(error.message || "Falha ao obter limites do símbolo");
  }
}

export function formatQuantity(quantity: number, stepSize: number): number {
  const precision = Math.max(0, Math.ceil(-Math.log10(stepSize)));
  return Math.floor(quantity * Math.pow(10, precision)) / Math.pow(10, precision);
}

let cachedSymbols: { symbol: string; baseAsset: string; quoteAsset: string }[] = [];
let symbolsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export async function getAvailableSymbols(search?: string): Promise<{ symbol: string; formatted: string }[]> {
  return getDefaultSymbols(search);
}

function getDefaultSymbols(search?: string): { symbol: string; formatted: string }[] {
  const defaultPairs = [
    { symbol: "BTCUSDT", formatted: "BTC/USDT" },
    { symbol: "ETHUSDT", formatted: "ETH/USDT" },
    { symbol: "BNBUSDT", formatted: "BNB/USDT" },
    { symbol: "SOLUSDT", formatted: "SOL/USDT" },
    { symbol: "XRPUSDT", formatted: "XRP/USDT" },
    { symbol: "ADAUSDT", formatted: "ADA/USDT" },
    { symbol: "DOGEUSDT", formatted: "DOGE/USDT" },
    { symbol: "AVAXUSDT", formatted: "AVAX/USDT" },
    { symbol: "DOTUSDT", formatted: "DOT/USDT" },
    { symbol: "MATICUSDT", formatted: "MATIC/USDT" },
    { symbol: "LINKUSDT", formatted: "LINK/USDT" },
    { symbol: "LTCUSDT", formatted: "LTC/USDT" },
    { symbol: "UNIUSDT", formatted: "UNI/USDT" },
    { symbol: "ATOMUSDT", formatted: "ATOM/USDT" },
    { symbol: "ETCUSDT", formatted: "ETC/USDT" },
    { symbol: "XLMUSDT", formatted: "XLM/USDT" },
    { symbol: "FILUSDT", formatted: "FIL/USDT" },
    { symbol: "TRXUSDT", formatted: "TRX/USDT" },
    { symbol: "NEARUSDT", formatted: "NEAR/USDT" },
    { symbol: "ALGOUSDT", formatted: "ALGO/USDT" },
    { symbol: "SHIBUSDT", formatted: "SHIB/USDT" },
    { symbol: "APTUSDT", formatted: "APT/USDT" },
    { symbol: "ARBUSDT", formatted: "ARB/USDT" },
    { symbol: "OPUSDT", formatted: "OP/USDT" },
    { symbol: "INJUSDT", formatted: "INJ/USDT" },
    { symbol: "SUIUSDT", formatted: "SUI/USDT" },
    { symbol: "SEIUSDT", formatted: "SEI/USDT" },
    { symbol: "TIAUSDT", formatted: "TIA/USDT" },
    { symbol: "AAVEUSDT", formatted: "AAVE/USDT" },
    { symbol: "LDOUSDT", formatted: "LDO/USDT" },
    { symbol: "PENDLEUSDT", formatted: "PENDLE/USDT" },
    { symbol: "MKRUSDT", formatted: "MKR/USDT" },
    { symbol: "CRVUSDT", formatted: "CRV/USDT" },
    { symbol: "SNXUSDT", formatted: "SNX/USDT" },
    { symbol: "COMPUSDT", formatted: "COMP/USDT" },
    { symbol: "GMXUSDT", formatted: "GMX/USDT" },
    { symbol: "RNDRUSDT", formatted: "RNDR/USDT" },
    { symbol: "FETUSDT", formatted: "FET/USDT" },
    { symbol: "AGIXUSDT", formatted: "AGIX/USDT" },
    { symbol: "OCEANUSDT", formatted: "OCEAN/USDT" },
    { symbol: "WLDUSDT", formatted: "WLD/USDT" },
    { symbol: "PEPEUSDT", formatted: "PEPE/USDT" },
    { symbol: "FLOKIUSDT", formatted: "FLOKI/USDT" },
    { symbol: "BONKUSDT", formatted: "BONK/USDT" },
    { symbol: "WIFUSDT", formatted: "WIF/USDT" },
    { symbol: "JUPUSDT", formatted: "JUP/USDT" },
    { symbol: "PYTHUSDT", formatted: "PYTH/USDT" },
    { symbol: "JTOUSDT", formatted: "JTO/USDT" },
    { symbol: "STXUSDT", formatted: "STX/USDT" },
    { symbol: "ORDIUSDT", formatted: "ORDI/USDT" },
    { symbol: "SATSUSDT", formatted: "SATS/USDT" },
  ];
  
  if (search && search.trim()) {
    const searchUpper = search.toUpperCase().trim();
    return defaultPairs.filter((p) => 
      p.formatted.toUpperCase().includes(searchUpper) || 
      p.symbol.includes(searchUpper)
    );
  }
  
  return defaultPairs;
}
