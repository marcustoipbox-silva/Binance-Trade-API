import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import * as binance from "./services/binance";
import * as botManager from "./services/botManager";
import { fetchFearGreedIndex, getValueClassificationPT } from "./services/fearGreed";
import { botConfigSchema, indicatorSettingsSchema } from "@shared/schema";

let apiKeys: { apiKey: string; secretKey: string } | null = null;
let demoModeEnabled = false;
let testnetEnabled = false;

export async function registerRoutes(server: Server, app: Express): Promise<void> {
  
  app.post("/api/binance/demo-mode", async (req, res) => {
    try {
      demoModeEnabled = true;
      binance.setDemoMode(true);
      
      // Resume active bots after enabling demo mode (critical for PM2 restarts)
      setTimeout(async () => {
        console.log("[Demo] Modo demo ativado, retomando bots ativos...");
        await botManager.resumeActiveBots();
      }, 1000);
      
      res.json({ success: true, message: "Modo demo ativado com sucesso" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/binance/disable-demo", async (req, res) => {
    try {
      demoModeEnabled = false;
      binance.setDemoMode(false);
      res.json({ success: true, message: "Modo demo desativado com sucesso" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/binance/disconnect", async (req, res) => {
    try {
      binance.disconnect();
      apiKeys = null;
      testnetEnabled = false;
      demoModeEnabled = false;
      res.json({ success: true, message: "Desconectado com sucesso" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/binance/connect", async (req, res) => {
    try {
      const { apiKey, secretKey, testnet = false } = req.body;
      
      if (!apiKey || !secretKey) {
        return res.status(400).json({ error: "API key e secret key são obrigatórios" });
      }
      
      const success = binance.initializeBinanceClient({ apiKey, secretKey, testnet });
      if (!success) {
        return res.status(500).json({ error: "Falha ao inicializar cliente Binance" });
      }
      
      const testResult = await binance.testConnection();
      if (!testResult.success) {
        return res.status(401).json({ error: testResult.message });
      }
      
      apiKeys = { apiKey, secretKey };
      testnetEnabled = testnet;
      demoModeEnabled = false;
      
      // Resume active bots after successful connection (critical for PM2 restarts)
      setTimeout(async () => {
        console.log("[Binance] Conexão estabelecida, retomando bots ativos...");
        await botManager.resumeActiveBots();
      }, 1000);
      
      const modeMsg = testnet ? " (Modo Testnet)" : "";
      res.json({ success: true, message: `Conexão estabelecida com sucesso${modeMsg}` });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Erro ao conectar" });
    }
  });

  app.get("/api/binance/status", async (req, res) => {
    try {
      if (demoModeEnabled) {
        return res.json({ connected: true, demoMode: true });
      }
      
      const connected = binance.isConnected();
      if (!connected) {
        return res.json({ connected: false });
      }
      
      const testResult = await binance.testConnection();
      res.json({ 
        connected: testResult.success, 
        message: testResult.message,
        testnet: testnetEnabled 
      });
    } catch (error: any) {
      res.json({ connected: false, error: error.message });
    }
  });

  app.get("/api/binance/balance", async (req, res) => {
    try {
      const balances = await binance.getAccountBalance();
      res.json(balances);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/binance/price/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const price = await binance.getPrice(symbol);
      res.json({ symbol, price });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/binance/ticker/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const ticker = await binance.get24hTicker(symbol);
      res.json(ticker);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/binance/candles/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const { interval = "1h", limit = "100" } = req.query;
      const candles = await binance.getCandles(symbol, interval as string, parseInt(limit as string));
      res.json(candles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bots", async (req, res) => {
    try {
      const bots = await botManager.getAllBotsWithStats();
      res.json(bots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bots/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const bot = await botManager.getBotWithStats(id);
      if (!bot) {
        return res.status(404).json({ error: "Bot não encontrado" });
      }
      res.json(bot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots", async (req, res) => {
    try {
      const parsed = botConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Configuração inválida", details: parsed.error.errors });
      }
      
      const config = parsed.data;
      const bot = await botManager.createBot({
        name: config.name,
        symbol: config.symbol,
        investment: config.investment,
        stopLoss: config.stopLoss,
        takeProfit: config.takeProfit,
        minSignals: config.minSignals,
        interval: config.interval,
        indicators: config.indicators,
        status: "stopped",
      });
      
      res.status(201).json(bot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots/:id/start", async (req, res) => {
    try {
      const { id } = req.params;
      const bot = await botManager.startBot(id);
      res.json(bot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots/:id/pause", async (req, res) => {
    try {
      const { id } = req.params;
      const bot = await botManager.pauseBot(id);
      res.json(bot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bots/:id/stop", async (req, res) => {
    try {
      const { id } = req.params;
      const bot = await botManager.stopBot(id);
      res.json(bot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/bots/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await botManager.deleteBot(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sincronizar saldo do bot com a Binance (usando histórico REAL de trades)
  app.post("/api/bots/:id/sync-balance", async (req, res) => {
    try {
      const { id } = req.params;
      const bot = await storage.getBot(id);
      
      if (!bot) {
        return res.status(404).json({ error: "Bot não encontrado" });
      }
      
      if (!binance.isConnected()) {
        return res.status(400).json({ error: "API Binance não conectada" });
      }
      
      const baseAsset = bot.symbol.split('/')[0];
      
      console.log(`[Sync] Buscando histórico REAL de trades para ${bot.symbol}...`);
      
      // Buscar posição real da Binance (saldo + histórico de trades)
      const position = await binance.calculatePosition(bot.symbol);
      
      console.log(`[Sync] Bot ${bot.name}: saldo=${position.balance}, preço médio compra=$${position.avgBuyPrice.toFixed(4)}`);
      
      // Verificar se já existe posição aberta no storage
      const existingPosition = await storage.getOpenPosition(id);
      
      // Se tem saldo mas não tem posição registrada, buscar o trade REAL da Binance
      if (position.balance > 0 && !existingPosition) {
        // Encontrar o trade de compra real que está "aberto"
        const openBuyTrade = await binance.findOpenBuyTrade(bot.symbol);
        
        if (openBuyTrade) {
          console.log(`[Sync] Trade de COMPRA REAL encontrado: ${openBuyTrade.qty} @ $${openBuyTrade.price} (orderId: ${openBuyTrade.orderId})`);
          
          // Criar trade com dados REAIS da Binance
          await storage.createTrade({
            botId: id,
            symbol: bot.symbol,
            side: "buy",
            type: "MARKET",
            price: openBuyTrade.price,
            amount: openBuyTrade.qty,
            total: openBuyTrade.qty * openBuyTrade.price,
            indicators: ["SYNC-REAL"],
            binanceOrderId: openBuyTrade.orderId,
            status: "completed",
          });
          
          await storage.addActivity({
            botId: id,
            botName: bot.name,
            symbol: bot.symbol,
            type: 'buy',
            message: `Trade REAL sincronizado: ${openBuyTrade.qty.toFixed(2)} ${baseAsset} @ $${openBuyTrade.price.toFixed(4)} (ordem: ${openBuyTrade.orderId})`,
            buySignals: 0,
            sellSignals: 0,
            indicators: ["SYNC-REAL"],
          });
        } else {
          // Fallback: usar preço médio de compra do histórico
          console.log(`[Sync] Usando preço médio de compra: $${position.avgBuyPrice.toFixed(4)}`);
          
          await storage.createTrade({
            botId: id,
            symbol: bot.symbol,
            side: "buy",
            type: "MARKET",
            price: position.avgBuyPrice,
            amount: position.balance,
            total: position.balance * position.avgBuyPrice,
            indicators: ["SYNC-AVG"],
            binanceOrderId: `sync-avg-${Date.now()}`,
            status: "completed",
          });
          
          await storage.addActivity({
            botId: id,
            botName: bot.name,
            symbol: bot.symbol,
            type: 'buy',
            message: `Posição sincronizada (preço médio): ${position.balance.toFixed(2)} ${baseAsset} @ $${position.avgBuyPrice.toFixed(4)}`,
            buySignals: 0,
            sellSignals: 0,
            indicators: ["SYNC-AVG"],
          });
        }
      }
      
      // Atualizar bot com saldo e preço médio REAIS da Binance
      const updatedBot = await storage.updateBot(id, {
        currentBalance: position.balance,
        avgEntryPrice: position.avgBuyPrice,
        investedAmount: position.balance * position.avgBuyPrice,
      });
      
      await storage.addActivity({
        botId: id,
        botName: bot.name,
        symbol: bot.symbol,
        type: 'analysis',
        message: `Saldo sincronizado com dados REAIS: ${position.balance.toFixed(2)} ${baseAsset} (preço médio compra: $${position.avgBuyPrice.toFixed(4)})`,
        buySignals: 0,
        sellSignals: 0,
        indicators: [],
      });
      
      res.json({ 
        success: true, 
        balance: position.balance,
        avgBuyPrice: position.avgBuyPrice,
        investedAmount: position.balance * position.avgBuyPrice,
        message: `Sincronizado: ${position.balance.toFixed(2)} ${baseAsset} @ $${position.avgBuyPrice.toFixed(4)}` 
      });
    } catch (error: any) {
      console.error(`[Sync] Erro:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/bots/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const oldBot = await storage.getBot(id);
      if (!oldBot) {
        return res.status(404).json({ error: "Bot não encontrado" });
      }
      
      const bot = await storage.updateBot(id, updateData);
      if (!bot) {
        return res.status(404).json({ error: "Bot não encontrado" });
      }
      
      // Se o robô está ativo e o intervalo ou indicadores mudaram, reiniciar
      if (oldBot.status === "active" && (
        updateData.interval !== undefined || 
        updateData.indicators !== undefined ||
        updateData.minSignals !== undefined
      )) {
        console.log(`[Bot ${bot.name}] Reiniciando devido a alteração de configuração`);
        await botManager.pauseBot(id);
        await botManager.startBot(id);
        
        await storage.addActivity({
          botId: id,
          botName: bot.name,
          symbol: bot.symbol,
          type: 'start',
          message: 'Robô reiniciado após alteração de configuração',
          buySignals: 0,
          sellSignals: 0,
          indicators: [],
        });
      }
      
      res.json(bot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resetar estatísticas do bot (útil quando dados estão corrompidos)
  app.post("/api/bots/:id/reset-stats", async (req, res) => {
    try {
      const { id } = req.params;
      const bot = await storage.getBot(id);
      
      if (!bot) {
        return res.status(404).json({ error: "Bot não encontrado" });
      }
      
      // Resetar estatísticas para zero
      const updatedBot = await storage.updateBot(id, {
        totalTrades: 0,
        winningTrades: 0,
        totalPnl: 0,
        currentBalance: 0,
      });
      
      // Limpar trades antigos deste bot
      await storage.clearTradesByBot(id);
      
      await storage.addActivity({
        botId: id,
        botName: bot.name,
        symbol: bot.symbol,
        type: 'analysis',
        message: 'Estatísticas do robô resetadas. Dados anteriores foram limpos.',
        buySignals: 0,
        sellSignals: 0,
        indicators: [],
      });
      
      res.json({ 
        success: true, 
        message: "Estatísticas resetadas com sucesso" 
      });
    } catch (error: any) {
      console.error(`[Reset] Erro:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/trades", async (req, res) => {
    try {
      const { botId } = req.query;
      const trades = await storage.getAllTrades(botId as string | undefined);
      res.json(trades);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/trades/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const trade = await storage.getTrade(id);
      if (!trade) {
        return res.status(404).json({ error: "Trade não encontrado" });
      }
      res.json(trade);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/trades", async (req, res) => {
    try {
      await storage.clearAllTrades();
      
      const bots = await storage.getAllBots();
      for (const bot of bots) {
        await storage.updateBot(bot.id, {
          totalTrades: 0,
          winningTrades: 0,
          totalPnl: 0,
        });
      }
      
      await storage.addActivity({
        botId: "system",
        botName: "Sistema",
        symbol: "-",
        type: 'analysis',
        message: 'Histórico de trades foi limpo pelo usuário.',
        buySignals: 0,
        sellSignals: 0,
        indicators: [],
      });
      
      res.json({ success: true, message: "Histórico de trades limpo com sucesso" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/activities", async (req, res) => {
    try {
      const { limit } = req.query;
      const activities = await storage.getActivities(limit ? parseInt(limit as string) : 50);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { symbol, indicators, interval } = req.body;
      
      if (!symbol) {
        return res.status(400).json({ error: "Símbolo é obrigatório" });
      }
      
      const parsedIndicators = indicatorSettingsSchema.safeParse(indicators);
      if (!parsedIndicators.success) {
        return res.status(400).json({ error: "Configuração de indicadores inválida" });
      }
      
      const analysis = await botManager.analyzeSymbol(symbol, parsedIndicators.data, interval || "1h");
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/binance/symbols", async (req, res) => {
    try {
      const { search } = req.query;
      const symbols = await binance.getAvailableSymbols(search as string | undefined);
      res.json(symbols);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const bots = await botManager.getAllBotsWithStats();
      const trades = await storage.getAllTrades();
      
      const totalPnl = bots.reduce((sum, b) => sum + b.totalPnl, 0);
      const activeBots = bots.filter((b) => b.status === "active").length;
      const totalTrades = bots.reduce((sum, b) => sum + b.totalTrades, 0);
      const totalWins = bots.reduce((sum, b) => sum + b.winningTrades, 0);
      const avgWinRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
      
      const totalInvestment = bots.reduce((sum, b) => sum + b.investment, 0);
      const pnlPercent = totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;
      
      res.json({
        totalPnl,
        pnlPercent,
        activeBots,
        totalBots: bots.length,
        totalTrades,
        avgWinRate,
        recentTrades: trades.slice(0, 10),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/fear-greed", async (req, res) => {
    try {
      const fgiData = await fetchFearGreedIndex();
      if (!fgiData) {
        return res.json({ 
          available: false, 
          message: "Índice Fear & Greed indisponível" 
        });
      }
      
      res.json({
        available: true,
        value: fgiData.value,
        classification: getValueClassificationPT(fgiData.valueClassification),
        updatedAt: fgiData.updatedAt.toISOString(),
        timestamp: fgiData.timestamp,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resume active bots after server startup (critical for PM2 restarts)
  // Wait a bit for storage to be ready and Binance to potentially auto-reconnect
  setTimeout(async () => {
    console.log("[Server] Iniciando verificação de bots ativos...");
    
    // Check if Binance is connected before resuming bots
    if (binance.isConnected()) {
      console.log("[Server] Binance conectada, retomando bots ativos...");
      await botManager.resumeActiveBots();
    } else {
      console.log("[Server] Binance não conectada. Bots ativos serão retomados após conexão manual.");
      
      // Log the number of active bots waiting
      try {
        const allBots = await storage.getAllBots();
        const activeBots = allBots.filter(b => b.status === "active");
        if (activeBots.length > 0) {
          console.log(`[Server] ⚠️ ${activeBots.length} bot(s) com status "ativo" aguardando conexão Binance`);
        }
      } catch (e) {
        // Ignore errors during startup check
      }
    }
  }, 3000);
}
