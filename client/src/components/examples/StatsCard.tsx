import { StatsCard } from "../bot/StatsCard";
import { DollarSign, TrendingUp, Bot, BarChart3 } from "lucide-react";

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-xl">
      <StatsCard
        title="Lucro Total"
        value="$12,345.67"
        change={15.3}
        changeLabel="este mês"
        icon={DollarSign}
        trend="up"
      />
      <StatsCard
        title="Robôs Ativos"
        value="3"
        icon={Bot}
        iconColor="text-primary"
        trend="neutral"
      />
      <StatsCard
        title="Win Rate"
        value="68.5%"
        change={2.1}
        changeLabel="vs semana passada"
        icon={BarChart3}
        trend="up"
      />
      <StatsCard
        title="Hoje"
        value="-$234.56"
        change={-3.2}
        changeLabel="24h"
        icon={TrendingUp}
        trend="down"
      />
    </div>
  );
}
