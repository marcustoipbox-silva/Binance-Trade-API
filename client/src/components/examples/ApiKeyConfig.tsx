import { ApiKeyConfig } from "../bot/ApiKeyConfig";

export default function ApiKeyConfigExample() {
  return (
    <div className="max-w-lg">
      <ApiKeyConfig
        hasKeys={false}
        isConnected={false}
        onSaveKeys={(apiKey, secretKey) => console.log("Salvar chaves:", { apiKey, secretKey })}
        onTestConnection={() => console.log("Testar conexão")}
      />
    </div>
  );
}
