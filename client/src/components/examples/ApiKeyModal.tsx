import { ApiKeyModal } from "../trading/ApiKeyModal";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ApiKeyModalExample() {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open API Modal</Button>
      <ApiKeyModal
        open={open}
        onOpenChange={setOpen}
        onSave={(apiKey, secretKey) => console.log("Saving:", { apiKey, secretKey })}
        hasExistingKeys={false}
      />
    </div>
  );
}
