import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Eye, EyeOff, Shield } from "lucide-react";
import { useState } from "react";

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (apiKey: string, secretKey: string) => void;
  hasExistingKeys?: boolean;
}

export function ApiKeyModal({ open, onOpenChange, onSave, hasExistingKeys = false }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  const handleSave = () => {
    if (onSave && apiKey && secretKey) {
      onSave(apiKey, secretKey);
      setApiKey("");
      setSecretKey("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Binance API Configuration
          </DialogTitle>
          <DialogDescription>
            {hasExistingKeys 
              ? "Update your API keys to connect with a different Binance account."
              : "Enter your Binance API keys to enable trading functionality."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Never share your API keys. Use keys with trading permissions only. Do not enable withdrawal permissions for security.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-sm">API Key</Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Binance API key"
              className="font-mono text-sm"
              data-testid="input-api-key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretKey" className="text-sm">Secret Key</Label>
            <div className="relative">
              <Input
                id="secretKey"
                type={showSecret ? "text" : "password"}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter your Binance secret key"
                className="font-mono text-sm pr-10"
                data-testid="input-secret-key"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-full w-10"
                onClick={() => setShowSecret(!showSecret)}
                data-testid="button-toggle-secret"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>To create API keys:</p>
            <ol className="list-decimal list-inside mt-1 space-y-0.5">
              <li>Log in to your Binance account</li>
              <li>Go to API Management</li>
              <li>Create a new API key with spot trading permissions</li>
              <li>Copy and paste the keys here</li>
            </ol>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-api">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!apiKey || !secretKey}
            data-testid="button-save-api"
          >
            Save Keys
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
