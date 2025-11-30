import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, TrendingDown, Clock, Play, Square, AlertCircle, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BotActivity } from "@shared/schema";

interface ActivityLogProps {
  botId?: string;
  maxItems?: number;
}

export function ActivityLog({ botId, maxItems = 20 }: ActivityLogProps) {
  const { data: activities = [], isLoading } = useQuery<BotActivity[]>({
    queryKey: ["/api/activities"],
    refetchInterval: 3000,
  });

  const filteredActivities = botId 
    ? activities.filter(a => a.botId === botId)
    : activities;

  const recentActivities = filteredActivities.slice(0, maxItems);

  const formatTime = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="h-4 w-4" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4" />;
      case 'start':
        return <Play className="h-4 w-4" />;
      case 'stop':
        return <Square className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'analysis':
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string, buySignals: number, sellSignals: number) => {
    switch (type) {
      case 'buy':
        return 'bg-green-500/20 text-green-500';
      case 'sell':
        return 'bg-red-500/20 text-red-500';
      case 'start':
        return 'bg-blue-500/20 text-blue-500';
      case 'stop':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'error':
        return 'bg-red-500/20 text-red-500';
      case 'analysis':
        if (buySignals > sellSignals) return 'bg-green-500/10 text-green-400';
        if (sellSignals > buySignals) return 'bg-red-500/10 text-red-400';
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'buy':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">COMPRA</Badge>;
      case 'sell':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">VENDA</Badge>;
      case 'start':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">INÍCIO</Badge>;
      case 'stop':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">PARADO</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">ERRO</Badge>;
      case 'analysis':
        return <Badge variant="outline" className="text-xs">ANÁLISE</Badge>;
      default:
        return <Badge variant="outline">{type.toUpperCase()}</Badge>;
    }
  };

  return (
    <Card data-testid="card-activity-log">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Atividade do Robô
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Carregando...
          </div>
        ) : recentActivities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma atividade ainda</p>
            <p className="text-xs mt-1">Inicie um robô para ver as análises</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {recentActivities.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                  data-testid={`activity-item-${activity.id}`}
                >
                  <div className={`p-2 rounded-full ${getActivityColor(activity.type, activity.buySignals, activity.sellSignals)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActivityBadge(activity.type)}
                      <span className="font-medium text-sm">{activity.botName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(activity.timestamp)} {formatTime(activity.timestamp)}
                      </span>
                    </div>
                    
                    <div className="mt-1 text-sm text-muted-foreground">
                      {activity.message}
                    </div>
                    
                    {activity.type === 'analysis' && (activity.buySignals > 0 || activity.sellSignals > 0) && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        <span className="text-xs">
                          <span className="text-green-500 font-medium">Compra: {activity.buySignals}</span>
                          {' / '}
                          <span className="text-red-500 font-medium">Venda: {activity.sellSignals}</span>
                        </span>
                      </div>
                    )}
                    
                    {activity.indicators && activity.indicators.length > 0 && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {activity.indicators.map((ind, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className={`text-xs ${
                              ind.includes('buy') ? 'border-green-500/50 text-green-500' : 
                              ind.includes('sell') ? 'border-red-500/50 text-red-500' : ''
                            }`}
                          >
                            {ind}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
