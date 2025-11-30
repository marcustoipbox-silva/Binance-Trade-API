import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConnectionStatus } from "@/components/trading/ConnectionStatus";
import { useEffect } from "react";

import Dashboard from "@/pages/Dashboard";
import BotDetails from "@/pages/BotDetails";
import Orders from "@/pages/Orders";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/bots" component={Dashboard} />
      <Route path="/bot/:id" component={BotDetails} />
      <Route path="/history" component={Orders} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

interface ConnectionStatusResponse {
  connected: boolean;
  message?: string;
  testnet?: boolean;
  demo?: boolean;
}

function AppContent() {
  const { data: connectionStatus } = useQuery<ConnectionStatusResponse>({
    queryKey: ['/api/binance/status'],
    refetchInterval: 30000,
  });
  
  const isConnected = connectionStatus?.connected ?? false;
  
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar 
          isConnected={isConnected} 
          activeBots={2} 
          totalBots={3}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">
                Sistema de Trading Automatizado
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <ConnectionStatus 
                isConnected={isConnected}
                onReconnect={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/binance/status'] });
                }}
              />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
