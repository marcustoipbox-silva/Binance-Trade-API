import { AppSidebar } from "../AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-[400px] w-full">
        <AppSidebar 
          isConnected={true}
          activeBots={2}
          totalBots={3}
        />
        <div className="flex-1 p-4 bg-background">
          <p className="text-muted-foreground">Área de conteúdo principal</p>
        </div>
      </div>
    </SidebarProvider>
  );
}
