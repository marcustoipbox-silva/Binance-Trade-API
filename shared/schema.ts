import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const indicatorSettingsSchema = z.object({
  rsi: z.object({
    enabled: z.boolean(),
    period: z.number().min(2).max(100).default(14),
    overbought: z.number().min(1).max(99).default(70),
    oversold: z.number().min(1).max(99).default(30),
  }).refine(data => data.overbought > data.oversold, {
    message: "Sobrecompra deve ser maior que Sobrevenda",
    path: ["overbought"],
  }),
  macd: z.object({
    enabled: z.boolean(),
    fastPeriod: z.number().min(2).max(50).default(12),
    slowPeriod: z.number().min(5).max(100).default(26),
    signalPeriod: z.number().min(2).max(50).default(9),
  }),
  bollingerBands: z.object({
    enabled: z.boolean(),
    period: z.number().min(5).max(100).default(20),
    stdDev: z.number().min(0.5).max(5).default(2),
  }),
  ema: z.object({
    enabled: z.boolean(),
    shortPeriod: z.number().min(2).max(50).default(12),
    longPeriod: z.number().min(5).max(200).default(26),
  }),
});

export type IndicatorSettings = z.infer<typeof indicatorSettingsSchema>;

export const botConfigSchema = z.object({
  name: z.string().min(1).max(50),
  symbol: z.string().min(1),
  investment: z.number().min(1),
  stopLoss: z.number().min(0).max(100).default(5),
  takeProfit: z.number().min(0).max(1000).default(10),
  trailingStopPercent: z.number().min(0).max(100).default(0),
  cooldownMinutes: z.number().min(0).max(1440).default(5),
  indicators: indicatorSettingsSchema,
  minSignals: z.number().min(1).max(4).default(2),
  interval: z.enum(["1m", "5m", "15m", "30m", "1h", "4h", "1d"]).default("1h"),
});

export type BotConfig = z.infer<typeof botConfigSchema>;

export const bots = pgTable("bots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  status: text("status").notNull().default("stopped"),
  investment: real("investment").notNull(),
  investedAmount: real("invested_amount").notNull().default(0),
  currentBalance: real("current_balance").notNull().default(0),
  avgEntryPrice: real("avg_entry_price").notNull().default(0),
  stopLoss: real("stop_loss").notNull().default(5),
  takeProfit: real("take_profit").notNull().default(10),
  trailingStopPercent: real("trailing_stop_percent").notNull().default(0),
  trailingStopPrice: real("trailing_stop_price"),
  highestPrice: real("highest_price"),
  cooldownMinutes: integer("cooldown_minutes").notNull().default(5),
  lastSellTime: timestamp("last_sell_time"),
  lastSellReason: text("last_sell_reason"),
  minSignals: integer("min_signals").notNull().default(2),
  interval: text("interval").notNull().default("1h"),
  indicators: jsonb("indicators").$type<IndicatorSettings>().notNull(),
  totalTrades: integer("total_trades").notNull().default(0),
  winningTrades: integer("winning_trades").notNull().default(0),
  totalPnl: real("total_pnl").notNull().default(0),
  lastSignal: text("last_signal"),
  lastSignalTime: timestamp("last_signal_time"),
  lastIndicatorValues: jsonb("last_indicator_values").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBotSchema = createInsertSchema(bots).omit({
  id: true,
  investedAmount: true,
  currentBalance: true,
  avgEntryPrice: true,
  trailingStopPrice: true,
  highestPrice: true,
  lastSellTime: true,
  lastSellReason: true,
  totalTrades: true,
  winningTrades: true,
  totalPnl: true,
  lastSignal: true,
  lastSignalTime: true,
  lastIndicatorValues: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBot = z.infer<typeof insertBotSchema>;
export type Bot = typeof bots.$inferSelect;

export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull(),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(),
  type: text("type").notNull().default("MARKET"),
  price: real("price").notNull(),
  amount: real("amount").notNull(),
  total: real("total").notNull(),
  pnl: real("pnl"),
  pnlPercent: real("pnl_percent"),
  indicators: text("indicators").array().notNull().default([]),
  binanceOrderId: text("binance_order_id"),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  createdAt: true,
});

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;

export const apiKeysSchema = z.object({
  apiKey: z.string().min(1),
  secretKey: z.string().min(1),
});

export type ApiKeys = z.infer<typeof apiKeysSchema>;

export interface IndicatorSignal {
  name: string;
  value: number;
  signal: "buy" | "sell" | "neutral";
  description: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume: string;
  high24h: number;
  low24h: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AccountBalance {
  asset: string;
  free: number;
  locked: number;
}

export interface BotWithStats extends Bot {
  pnlPercent: number;
  winRate: number;
  avgProfit: number;
  activeIndicators: string[];
}

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull(),
  botName: text("bot_name").notNull(),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  buySignals: integer("buy_signals").notNull().default(0),
  sellSignals: integer("sell_signals").notNull().default(0),
  indicators: text("indicators").array().notNull().default([]),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type BotActivity = typeof activities.$inferSelect;
