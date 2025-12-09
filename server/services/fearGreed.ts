import { storage } from "../storage";

interface FearGreedData {
  value: number;
  valueClassification: string;
  timestamp: string;
  updatedAt: Date;
}

interface CMCFearGreedResponse {
  status: {
    timestamp: string;
    error_code: string | number;
    error_message: string | null;
    credit_count: number;
  };
  data: Array<{
    timestamp: string;
    value: number;
    value_classification: string;
  }>;
}

let cachedData: FearGreedData | null = null;
let cachedApiKey: string | null = null;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

export function setCoinMarketCapApiKey(apiKey: string | undefined): void {
  cachedApiKey = apiKey || null;
  cachedData = null;
}

export function hasCoinMarketCapApiKey(): boolean {
  return !!cachedApiKey;
}

async function getApiKey(): Promise<string | null> {
  if (cachedApiKey) {
    return cachedApiKey;
  }
  
  try {
    const settings = await storage.getAppSettings();
    if (settings.coinmarketcapApiKey) {
      cachedApiKey = settings.coinmarketcapApiKey;
      return cachedApiKey;
    }
  } catch (error) {
    console.error("[FGI] Erro ao buscar chave da API:", error);
  }
  
  return null;
}

export function getValueClassificationPT(classification: string): string {
  const translations: Record<string, string> = {
    "Extreme Fear": "Medo Extremo",
    "Fear": "Medo",
    "Neutral": "Neutro",
    "Greed": "Ganância",
    "Extreme Greed": "Ganância Extrema",
  };
  return translations[classification] || classification;
}

export async function fetchFearGreedIndex(): Promise<FearGreedData | null> {
  if (cachedData && (Date.now() - cachedData.updatedAt.getTime()) < CACHE_DURATION_MS) {
    console.log(`[FGI] Usando cache (valor: ${cachedData.value}, atualizado: ${cachedData.updatedAt.toISOString()})`);
    return cachedData;
  }

  const apiKey = await getApiKey();
  
  if (!apiKey) {
    console.error("[FGI] COINMARKETCAP_API_KEY não configurada - configure em Configurações");
    return null;
  }

  try {
    console.log("[FGI] Buscando índice de Medo e Ganância da CoinMarketCap...");
    
    const response = await fetch(
      "https://pro-api.coinmarketcap.com/v3/fear-and-greed/historical?limit=1",
      {
        headers: {
          "X-CMC_PRO_API_KEY": apiKey,
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[FGI] Erro na API: ${response.status} - ${errorText}`);
      return cachedData;
    }

    const data: CMCFearGreedResponse = await response.json();
    
    const errorCode = String(data.status.error_code);
    if (errorCode !== "0") {
      console.error(`[FGI] Erro da API (código ${errorCode}): ${data.status.error_message || 'Sem mensagem'}`);
      console.error(`[FGI] Resposta completa:`, JSON.stringify(data.status));
      return cachedData;
    }

    if (!data.data || data.data.length === 0) {
      console.error("[FGI] Nenhum dado retornado pela API");
      return cachedData;
    }

    const latest = data.data[0];
    
    cachedData = {
      value: latest.value,
      valueClassification: latest.value_classification,
      timestamp: latest.timestamp,
      updatedAt: new Date(),
    };

    console.log(`[FGI] Índice atualizado: ${cachedData.value} (${getValueClassificationPT(cachedData.valueClassification)})`);
    
    return cachedData;
  } catch (error) {
    console.error("[FGI] Erro ao buscar índice:", error);
    return cachedData;
  }
}

export function getCachedFearGreedIndex(): FearGreedData | null {
  return cachedData;
}

export function isFearGreedDataStale(): boolean {
  if (!cachedData) return true;
  return (Date.now() - cachedData.updatedAt.getTime()) > (24 * 60 * 60 * 1000);
}

export interface FGISignalResult {
  signal: "buy" | "sell" | "neutral";
  value: number;
  classification: string;
  description: string;
  isStale: boolean;
}

export function analyzeFearGreedSignal(
  currentValue: number,
  settings: {
    buyThreshold: number;
    sellIncreasePercent: number;
    stopLossPercent: number;
  },
  entryFGI?: number
): FGISignalResult {
  const isStale = isFearGreedDataStale();
  const classification = getValueClassificationForValue(currentValue);
  const classificationPT = getValueClassificationPT(classification);
  
  let signal: "buy" | "sell" | "neutral" = "neutral";
  let description = `FGI: ${currentValue} (${classificationPT})`;

  if (currentValue <= settings.buyThreshold) {
    signal = "buy";
    description = `FGI ${currentValue} ≤ ${settings.buyThreshold} (${classificationPT} - sinal de compra)`;
  } else if (entryFGI !== undefined && entryFGI > 0) {
    const increaseFromEntry = ((currentValue - entryFGI) / entryFGI) * 100;
    const decreaseFromEntry = ((entryFGI - currentValue) / entryFGI) * 100;

    if (increaseFromEntry >= settings.sellIncreasePercent) {
      signal = "sell";
      description = `FGI subiu ${increaseFromEntry.toFixed(1)}% desde entrada (${entryFGI} → ${currentValue}) - Take Profit`;
    } else if (decreaseFromEntry >= settings.stopLossPercent) {
      signal = "sell";
      description = `FGI caiu ${decreaseFromEntry.toFixed(1)}% desde entrada (${entryFGI} → ${currentValue}) - Stop Loss`;
    } else {
      description = `FGI: ${currentValue} (entrada: ${entryFGI}, var: ${increaseFromEntry >= 0 ? '+' : ''}${increaseFromEntry.toFixed(1)}%)`;
    }
  }

  return {
    signal,
    value: currentValue,
    classification: classificationPT,
    description,
    isStale,
  };
}

function getValueClassificationForValue(value: number): string {
  if (value <= 24) return "Extreme Fear";
  if (value <= 49) return "Fear";
  if (value === 50) return "Neutral";
  if (value <= 74) return "Greed";
  return "Extreme Greed";
}
