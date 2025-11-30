import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Bot, 
  History, 
  Settings, 
  TrendingUp,
  Wifi,
  WifiOff
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface AppSidebarProps {
  isConnected?: boolean;
  activeBots?: number;
  totalBots?: number;
}

const mainNavItems = [
  { title: "Painel", icon: LayoutDashboard, path: "/" },
  { title: "Meus Robôs", icon: Bot, path: "/bots" },
  { title: "Histórico", icon: History, path: "/history" },
  { title: "Configurações", icon: Settings, path: "/settings" },
];

export function AppSidebar({ isConnected = false, activeBots = 0, totalBots = 0 }: AppSidebarProps) {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm">Binance Bot</p>
            <p className="text-xs text-muted-foreground">Trading Automatizado</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.path}
                    data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <Link href={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Status</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Conexão API</span>
                <Badge 
                  variant="secondary"
                  className={isConnected ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}
                >
                  {isConnected ? (
                    <>
                      <Wifi className="h-3 w-3 mr-1" />
                      Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 mr-1" />
                      Offline
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Robôs Ativos</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {activeBots}/{totalBots}
                </Badge>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">Binance Trading Bot</p>
          <p className="text-xs text-muted-foreground">v1.0.0 - PT-BR</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
