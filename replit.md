# Binance Trading Bot System

## Overview

An automated cryptocurrency trading bot system for Binance that uses technical indicators (RSI, MACD, Bollinger Bands, EMA) to make intelligent buy/sell decisions. The system provides real-time monitoring, bot configuration, and trade history tracking with a dark-themed professional interface in Portuguese (Brazil).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript
- Vite as build tool and development server
- Wouter for client-side routing
- TanStack Query for server state management
- Shadcn/ui components with Radix UI primitives
- Tailwind CSS for styling

**Design System:**
- Dark theme foundation inspired by trading platforms (3Commas, Cryptohopper)
- Custom color palette optimized for reduced eye strain during extended monitoring
- Monospace fonts for numerical data (prices, percentages, quantities)
- All UI text in Portuguese (Brazil)
- Inter font for interface text via Google Fonts CDN

**Key Frontend Components:**
- Bot management dashboard with real-time status updates
- Trading chart visualization with candlestick data
- Indicator configuration panels (RSI, MACD, Bollinger Bands, EMA)
- Order history and trade logging
- API key configuration interface
- Connection status monitoring

**State Management Pattern:**
- Server state managed via TanStack Query with configured refetch intervals
- Component-level state using React hooks
- Real-time updates via polling (5-60 second intervals depending on data type)

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Drizzle ORM for database operations
- PostgreSQL database (configured for Neon serverless)
- Session management with express-session
- ESBuild for server bundling

**Core Services:**

1. **Binance Integration Service** (`server/services/binance.ts`)
   - Manages MainClient and WebsocketClient instances from 'binance' npm package
   - Handles API key initialization and connection testing
   - Provides market data retrieval and order execution
   - Connection status validation

2. **Bot Manager Service** (`server/services/botManager.ts`)
   - Controls bot lifecycle (start, pause, stop)
   - Manages NodeJS intervals for each active bot
   - Executes trading logic based on indicator signals
   - Tracks open positions and enforces stop-loss/take-profit rules
   - Validates and normalizes indicator settings

3. **Indicator Analysis Service** (`server/services/indicators.ts`)
   - Calculates RSI, MACD, Bollinger Bands, and EMA using technicalindicators library
   - Aggregates signals from multiple indicators
   - Determines overall buy/sell/hold recommendations
   - Provides signal strength metrics (buy/sell strength percentages)

**API Endpoints:**
- `POST /api/binance/connect` - Initialize Binance API connection
- `GET /api/binance/status` - Check connection status
- `GET /api/stats` - Retrieve dashboard statistics
- `GET /api/bots` - List all bots with stats
- `POST /api/bots` - Create new trading bot
- `PUT /api/bots/:id` - Update bot configuration
- `DELETE /api/bots/:id` - Delete bot
- `POST /api/bots/:id/start` - Start bot execution
- `POST /api/bots/:id/pause` - Pause bot execution
- `POST /api/bots/:id/stop` - Stop bot execution
- `GET /api/trades` - Retrieve trade history

**Storage Layer:**
- In-memory storage implementation (`MemStorage`) for development
- Database schema defined in `shared/schema.ts` using Drizzle ORM
- Tables: users, bots (with JSONB indicator settings), trades
- Storage interface (`IStorage`) allows for database implementation swap

### Data Models

**Bot Configuration:**
- Name, trading symbol (e.g., BTC/USDT)
- Investment amount, stop-loss, take-profit thresholds
- Indicator settings (RSI, MACD, Bollinger Bands, EMA) with configurable periods and thresholds
- Minimum required signals before executing trades
- Status tracking (active, paused, stopped, error)

**Trade Records:**
- Timestamp, symbol, side (buy/sell)
- Price, amount, total value
- Associated bot ID
- Profit/loss calculations
- Indicator signals that triggered the trade
- Trade status (completed, pending, cancelled)

**Performance Metrics:**
- Total P&L (profit and loss)
- Win rate percentage
- Average profit per trade
- Total trade count
- Active bot count

## External Dependencies

**Third-Party APIs:**
- **Binance API** - Primary cryptocurrency exchange integration
  - Requires API key and secret key
  - Used for market data, account balances, and order execution
  - Connection managed via 'binance' npm package (MainClient, WebsocketClient)
  - Supports both Production and Testnet environments
  - Testnet available at testnet.binance.vision for testing with fake funds

**Connection Modes:**
- **Production Mode** - Real Binance trading with actual funds
- **Testnet Mode** - Binance Testnet environment with fictitious funds (recommended for testing)
- **Demo Mode** - Fully simulated environment when Binance API is unavailable

**Important: Geographic Restriction on Replit:**
- Binance blocks ALL API access (Production AND Testnet) from Replit server regions
- This is a Binance-side IP restriction, not a code limitation
- **Demo Mode is the recommended solution** for testing on Replit
- For real trading, the system must be deployed to a VPS in an unrestricted region

**VirtualBox Deployment:**
- See `DEPLOY_VIRTUALBOX.md` for complete setup guide
- Use `setup-vm.sh` script for automated installation on Ubuntu
- Requires Ubuntu Server 22.04 LTS with bridged network
- PM2 manages the Node.js process with auto-restart

**Database:**
- **PostgreSQL** - Persistent data storage
  - Configured for Neon Database serverless deployment
  - Connection via `@neondatabase/serverless`
  - Schema migrations managed by Drizzle Kit

**NPM Packages:**
- `binance` - Binance exchange API client
- `technicalindicators` - Technical analysis calculations (RSI, MACD, etc.)
- `drizzle-orm` - Type-safe database ORM
- `express` - Web server framework
- `react` - UI library
- `@tanstack/react-query` - Server state management
- `tailwindcss` - Utility-first CSS framework
- `zod` - Schema validation
- Multiple Radix UI components for accessible UI primitives

**Development Tools:**
- Vite with HMR for fast development
- TypeScript for type safety
- ESBuild for production bundling
- Replit-specific plugins for development environment integration