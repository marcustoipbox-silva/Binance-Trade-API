import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ConnectionStatusProps {
  isConnected: boolean;
  isLoading?: boolean;
  onReconnect?: () => void;
}

export function ConnectionStatus({ isConnected, isLoading: initialLoading, onReconnect }: ConnectionStatusProps) {
  const [isLoading, setIsLoading] = useState(initialLoading || false);

  const handleReconnect = () => {
    setIsLoading(true);
    setTimeout(() => {
      onReconnect?.();
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="secondary"
        className={`gap-1.5 ${
          isConnected 
            ? 'bg-green-500/10 text-green-500' 
            : 'bg-red-500/10 text-red-500'
        }`}
        data-testid="badge-connection-status"
      >
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3" />
            <span className="text-xs">Conectado</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span className="text-xs">Desconectado</span>
          </>
        )}
      </Badge>
      {!isConnected && onReconnect && (
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleReconnect}
          disabled={isLoading}
          data-testid="button-reconnect"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}
