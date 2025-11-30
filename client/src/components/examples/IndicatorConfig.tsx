import { useState } from "react";
import { IndicatorConfig, IndicatorSettings } from "../bot/IndicatorConfig";
import { TooltipProvider } from "@/components/ui/tooltip";

const defaultSettings: IndicatorSettings = {
  rsi: { enabled: true, period: 14, overbought: 70, oversold: 30 },
  macd: { enabled: true, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  bollingerBands: { enabled: false, period: 20, stdDev: 2 },
  ema: { enabled: true, shortPeriod: 12, longPeriod: 26 },
};

export default function IndicatorConfigExample() {
  const [settings, setSettings] = useState<IndicatorSettings>(defaultSettings);

  return (
    <TooltipProvider>
      <div className="max-w-lg">
        <IndicatorConfig settings={settings} onChange={setSettings} />
      </div>
    </TooltipProvider>
  );
}
