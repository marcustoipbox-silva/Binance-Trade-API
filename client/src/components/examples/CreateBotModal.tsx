import { useState } from "react";
import { CreateBotModal } from "../bot/CreateBotModal";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Plus } from "lucide-react";

export default function CreateBotModalExample() {
  const [open, setOpen] = useState(true);

  return (
    <TooltipProvider>
      <div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Novo Robô
        </Button>
        <CreateBotModal
          open={open}
          onOpenChange={setOpen}
          onCreateBot={(config) => console.log("Bot criado:", config)}
        />
      </div>
    </TooltipProvider>
  );
}
