import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { 
  users, bots, trades, activities,
  type InsertUser, type User, 
  type Bot, type InsertBot, 
  type Trade, type InsertTrade, 
  type BotActivity
} from "@shared/schema";

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
  
  getActivities(limit?: number): Promise<BotActivity[]>;
  addActivity(activity: Omit<BotActivity, 'id' | 'timestamp'>): Promise<BotActivity>;
  clearActivities(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private bots: Map<string, Bot> = new Map();
  private trades: Map<string, Trade> = new Map();
  private activities: BotActivity[] = [];
  private maxActivities = 100;

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

  async getActivities(limit: number = 50): Promise<BotActivity[]> {
    return this.activities.slice(0, limit);
  }

  async addActivity(activity: Omit<BotActivity, 'id' | 'timestamp'>): Promise<BotActivity> {
    const newActivity: BotActivity = {
      ...activity,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    
    this.activities.unshift(newActivity);
    
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(0, this.maxActivities);
    }
    
    return newActivity;
  }

  async clearActivities(): Promise<void> {
    this.activities = [];
  }
}

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  
  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllBots(): Promise<Bot[]> {
    return await this.db.select().from(bots).orderBy(desc(bots.createdAt));
  }

  async getBot(id: string): Promise<Bot | undefined> {
    const result = await this.db.select().from(bots).where(eq(bots.id, id));
    return result[0];
  }

  async createBot(insertBot: InsertBot): Promise<Bot> {
    const result = await this.db.insert(bots).values({
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
    }).returning();
    return result[0];
  }

  async updateBot(id: string, data: Partial<Bot>): Promise<Bot | undefined> {
    const result = await this.db.update(bots)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bots.id, id))
      .returning();
    return result[0];
  }

  async deleteBot(id: string): Promise<void> {
    await this.db.delete(trades).where(eq(trades.botId, id));
    await this.db.delete(activities).where(eq(activities.botId, id));
    await this.db.delete(bots).where(eq(bots.id, id));
  }

  async getAllTrades(botId?: string): Promise<Trade[]> {
    if (botId) {
      return await this.db.select().from(trades)
        .where(eq(trades.botId, botId))
        .orderBy(desc(trades.createdAt));
    }
    return await this.db.select().from(trades).orderBy(desc(trades.createdAt));
  }

  async getTrade(id: string): Promise<Trade | undefined> {
    const result = await this.db.select().from(trades).where(eq(trades.id, id));
    return result[0];
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const result = await this.db.insert(trades).values({
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
    }).returning();
    return result[0];
  }

  async getOpenPosition(botId: string): Promise<Trade | undefined> {
    const botTrades = await this.db.select().from(trades)
      .where(eq(trades.botId, botId))
      .orderBy(desc(trades.createdAt));
    
    const lastTrade = botTrades[0];
    if (lastTrade && lastTrade.side === "buy") {
      return lastTrade;
    }
    return undefined;
  }

  async getActivities(limit: number = 50): Promise<BotActivity[]> {
    return await this.db.select().from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  async addActivity(activity: Omit<BotActivity, 'id' | 'timestamp'>): Promise<BotActivity> {
    const result = await this.db.insert(activities).values({
      botId: activity.botId,
      botName: activity.botName,
      symbol: activity.symbol,
      type: activity.type,
      message: activity.message,
      buySignals: activity.buySignals,
      sellSignals: activity.sellSignals,
      indicators: activity.indicators,
    }).returning();
    
    const count = await this.db.select().from(activities);
    if (count.length > 100) {
      const oldActivities = await this.db.select().from(activities)
        .orderBy(desc(activities.timestamp))
        .offset(100);
      for (const old of oldActivities) {
        await this.db.delete(activities).where(eq(activities.id, old.id));
      }
    }
    
    return result[0];
  }

  async clearActivities(): Promise<void> {
    await this.db.delete(activities);
  }
}

function createStorage(): IStorage {
  if (process.env.DATABASE_URL) {
    console.log("[Storage] Usando PostgreSQL (DATABASE_URL encontrada)");
    return new DatabaseStorage();
  } else {
    console.log("[Storage] Usando MemStorage (DATABASE_URL não encontrada)");
    return new MemStorage();
  }
}

export const storage = createStorage();
