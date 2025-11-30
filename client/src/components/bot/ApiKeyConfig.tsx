import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Eye, EyeOff, Shield, Check, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiKeyConfigProps {
  hasKeys: boolean;
  isConnected: boolean;
  onSaveKeys?: (apiKey: string, secretKey: string) => void;
  onTestConnection?: () => void;
}

export function ApiKeyConfig({ hasKeys, isConnected, onSaveKeys, onTestConnection }: ApiKeyConfigProps) {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleSave = () => {
    if (apiKey && secretKey) {
      onSaveKeys?.(apiKey, secretKey);
      toast({
        title: "Chaves API salvas",
        description: "Suas chaves foram salvas com sucesso.",
      });
      setApiKey("");
      setSecretKey("");
    }
  };

  const handleTest = async () => {
    setTesting(true);
    onTestConnection?.();
    setTimeout(() => {
      setTesting(false);
      toast({
        title: "Conexão testada",
        description: isConnected ? "Conexão com a Binance estabelecida!" : "Falha na conexão. Verifique suas chaves.",
      });
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Configuração da API Binance</CardTitle>
              <CardDescription>Conecte sua conta Binance para trading automatizado</CardDescription>
            </div>
          </div>
          <Badge 
            variant="secondary"
            className={isConnected ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}
          >
            {isConnected ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Conectado
              </>
            ) : (
              <>
                <X className="h-3 w-3 mr-1" />
                Desconectado
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
          <div className="text-xs text-yellow-600 dark:text-yellow-400">
            <p className="font-medium mb-1">Importante:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Nunca compartilhe suas chaves API</li>
              <li>Use apenas permissões de trading (spot)</li>
              <li>NÃO habilite permissões de saque</li>
              <li>Restrinja o acesso por IP se possível</li>
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-sm">Chave API</Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasKeys ? "••••••••••••••••••••" : "Digite sua chave API da Binance"}
              className="font-mono text-sm"
              data-testid="input-api-key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretKey" className="text-sm">Chave Secreta</Label>
            <div className="relative">
              <Input
                id="secretKey"
                type={showSecret ? "text" : "password"}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={hasKeys ? "••••••••••••••••••••" : "Digite sua chave secreta"}
                className="font-mono text-sm pr-10"
                data-testid="input-secret-key"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-full w-10"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Como obter suas chaves:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Acesse sua conta Binance</li>
            <li>Vá em Gerenciamento de API</li>
            <li>Crie uma nova chave API com permissão de trading spot</li>
            <li>Copie e cole as chaves aqui</li>
          </ol>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            onClick={handleTest}
            disabled={testing || (!hasKeys && (!apiKey || !secretKey))}
            data-testid="button-test-connection"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            Testar Conexão
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!apiKey || !secretKey}
            data-testid="button-save-keys"
          >
            <Shield className="h-4 w-4 mr-2" />
            Salvar Chaves
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
