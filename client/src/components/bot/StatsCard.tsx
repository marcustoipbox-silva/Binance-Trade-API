import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  onClick?: () => void;
  clickable?: boolean;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeLabel,
  icon: Icon, 
  iconColor = "text-primary",
  trend = "neutral",
  onClick,
  clickable = false
}: StatsCardProps) {
  const trendConfig = {
    up: { icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
    down: { icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10" },
    neutral: { icon: Minus, color: "text-muted-foreground", bg: "bg-muted" },
  };

  const TrendIcon = trendConfig[trend].icon;

  return (
    <Card 
      className={`hover-elevate ${clickable || onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      data-testid={onClick ? `card-clickable-${title.toLowerCase().replace(/\s/g, '-')}` : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-mono font-bold" data-testid={`stat-value-${title.toLowerCase().replace(/\s/g, '-')}`}>
              {value}
            </p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-xs ${trendConfig[trend].color}`}>
                <TrendIcon className="h-3 w-3" />
                <span>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                  {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
                </span>
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg ${trendConfig[trend].bg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
