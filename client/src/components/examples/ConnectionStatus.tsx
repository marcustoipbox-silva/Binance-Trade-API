import { ConnectionStatus } from "../trading/ConnectionStatus";
import { useState } from "react";

export default function ConnectionStatusExample() {
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleReconnect = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="flex gap-4 items-center">
      <ConnectionStatus 
        isConnected={isConnected} 
        isLoading={isLoading}
        onReconnect={handleReconnect}
      />
      <button 
        className="text-xs text-muted-foreground underline"
        onClick={() => setIsConnected(!isConnected)}
      >
        Toggle Status
      </button>
    </div>
  );
}
