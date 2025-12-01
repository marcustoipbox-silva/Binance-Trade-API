import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { 
  users, bots, trades, activities,
  type InsertUser, type User, 
  type Bot, type InsertBot, 
  type Trade, type InsertTrade, 
  type BotActivity, type InsertActivity 
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

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllBots(): Promise<Bot[]> {
    return await db.select().from(bots).orderBy(desc(bots.createdAt));
  }

  async getBot(id: string): Promise<Bot | undefined> {
    const result = await db.select().from(bots).where(eq(bots.id, id));
    return result[0];
  }

  async createBot(insertBot: InsertBot): Promise<Bot> {
    const result = await db.insert(bots).values({
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
    const result = await db.update(bots)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bots.id, id))
      .returning();
    return result[0];
  }

  async deleteBot(id: string): Promise<void> {
    await db.delete(trades).where(eq(trades.botId, id));
    await db.delete(activities).where(eq(activities.botId, id));
    await db.delete(bots).where(eq(bots.id, id));
  }

  async getAllTrades(botId?: string): Promise<Trade[]> {
    if (botId) {
      return await db.select().from(trades)
        .where(eq(trades.botId, botId))
        .orderBy(desc(trades.createdAt));
    }
    return await db.select().from(trades).orderBy(desc(trades.createdAt));
  }

  async getTrade(id: string): Promise<Trade | undefined> {
    const result = await db.select().from(trades).where(eq(trades.id, id));
    return result[0];
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const result = await db.insert(trades).values({
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
    const botTrades = await db.select().from(trades)
      .where(eq(trades.botId, botId))
      .orderBy(desc(trades.createdAt));
    
    const lastTrade = botTrades[0];
    if (lastTrade && lastTrade.side === "buy") {
      return lastTrade;
    }
    return undefined;
  }

  async getActivities(limit: number = 50): Promise<BotActivity[]> {
    return await db.select().from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  async addActivity(activity: Omit<BotActivity, 'id' | 'timestamp'>): Promise<BotActivity> {
    const result = await db.insert(activities).values({
      botId: activity.botId,
      botName: activity.botName,
      symbol: activity.symbol,
      type: activity.type,
      message: activity.message,
      buySignals: activity.buySignals,
      sellSignals: activity.sellSignals,
      indicators: activity.indicators,
    }).returning();
    
    const count = await db.select().from(activities);
    if (count.length > 100) {
      const oldActivities = await db.select().from(activities)
        .orderBy(desc(activities.timestamp))
        .offset(100);
      for (const old of oldActivities) {
        await db.delete(activities).where(eq(activities.id, old.id));
      }
    }
    
    return result[0];
  }

  async clearActivities(): Promise<void> {
    await db.delete(activities);
  }
}

export const storage = new DatabaseStorage();
