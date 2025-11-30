import type { InsertUser, User, Bot, InsertBot, Trade, InsertTrade } from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllBots(): Promise<Bot[]>;
  getBot(id: string): Promise<Bot | undefined>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: string, data: Partial<Bot>): Promise<Bot | undefined>;
  deleteBot(id: string): Promise<void>;
  
  getAllTrades(botId?: string): Promise<Trade[]>;
  getTrade(id: string): Promise<Trade | undefined>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  getOpenPosition(botId: string): Promise<Trade | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private bots: Map<string, Bot> = new Map();
  private trades: Map<string, Trade> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllBots(): Promise<Bot[]> {
    return Array.from(this.bots.values());
  }

  async getBot(id: string): Promise<Bot | undefined> {
    return this.bots.get(id);
  }

  async createBot(insertBot: InsertBot): Promise<Bot> {
    const id = crypto.randomUUID();
    const now = new Date();
    const bot: Bot = {
      id,
      name: insertBot.name,
      symbol: insertBot.symbol,
      status: insertBot.status || "stopped",
      investment: insertBot.investment,
      currentBalance: 0,
      stopLoss: insertBot.stopLoss || 5,
      takeProfit: insertBot.takeProfit || 10,
      minSignals: insertBot.minSignals || 2,
      interval: insertBot.interval || "1h",
      indicators: insertBot.indicators,
      totalTrades: 0,
      winningTrades: 0,
      totalPnl: 0,
      lastSignal: null,
      lastSignalTime: null,
      createdAt: now,
      updatedAt: now,
    };
    this.bots.set(id, bot);
    return bot;
  }

  async updateBot(id: string, data: Partial<Bot>): Promise<Bot | undefined> {
    const bot = this.bots.get(id);
    if (!bot) return undefined;

    const updatedBot: Bot = {
      ...bot,
      ...data,
      updatedAt: new Date(),
    };
    this.bots.set(id, updatedBot);
    return updatedBot;
  }

  async deleteBot(id: string): Promise<void> {
    this.bots.delete(id);
    const tradeIds = Array.from(this.trades.keys());
    for (const tradeId of tradeIds) {
      const trade = this.trades.get(tradeId);
      if (trade && trade.botId === id) {
        this.trades.delete(tradeId);
      }
    }
  }

  async getAllTrades(botId?: string): Promise<Trade[]> {
    const trades = Array.from(this.trades.values());
    if (botId) {
      return trades.filter((t) => t.botId === botId);
    }
    return trades.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async getTrade(id: string): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = crypto.randomUUID();
    const trade: Trade = {
      id,
      botId: insertTrade.botId,
      symbol: insertTrade.symbol,
      side: insertTrade.side,
      type: insertTrade.type || "MARKET",
      price: insertTrade.price,
      amount: insertTrade.amount,
      total: insertTrade.total,
      pnl: insertTrade.pnl || null,
      pnlPercent: insertTrade.pnlPercent || null,
      indicators: insertTrade.indicators || [],
      binanceOrderId: insertTrade.binanceOrderId || null,
      status: insertTrade.status || "completed",
      createdAt: new Date(),
    };
    this.trades.set(id, trade);
    return trade;
  }

  async getOpenPosition(botId: string): Promise<Trade | undefined> {
    const trades = await this.getAllTrades(botId);
    const sortedTrades = trades.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    
    const lastTrade = sortedTrades[0];
    if (lastTrade && lastTrade.side === "buy") {
      return lastTrade;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
