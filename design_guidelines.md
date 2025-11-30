# Design Guidelines: Binance Automated Trading Bot System

## Design Approach

**Selected Approach:** Trading Platform Reference + Material Design System  
**Justification:** Bot automation platforms require real-time monitoring clarity, instant control feedback, and professional trust signals. Drawing inspiration from 3Commas, Cryptohopper, and TradingView bots while implementing Material Design principles for consistent data visualization.

**Core Principles:**
- Bot status visibility: Active/paused/stopped states immediately clear
- Performance at-a-glance: P&L metrics front and center
- Safe controls: Confirmation flows for critical actions
- Strategy transparency: Configuration parameters always visible
- Dark theme foundation: Reduces eye strain during extended monitoring

---

## Typography System

**Font Family:** Inter (via Google Fonts CDN)

**Hierarchy:**
- Page Headers: 28px, font-bold (Dashboard, Estratégias, Histórico)
- Bot Names: 20px, font-semibold
- Section Headers: 16px, font-semibold
- Data Labels: 14px, font-medium
- Numerical Data: 18px, font-mono (preços, lucros, percentagens)
- Body Text: 14px, font-normal
- Small Text: 12px, font-normal (timestamps, descrições)

**Critical:** All prices, percentages, quantities use font-mono for perfect alignment. All interface text in Portuguese (Brazil).

---

## Color System

**Dark Theme Foundation:**
- Background Primary: #0B0E11 (deep dark)
- Background Secondary: #161A1E (card backgrounds)
- Background Tertiary: #1E2329 (input fields, panels)
- Border Color: #2B3139
- Text Primary: #EAECEF (high contrast white)
- Text Secondary: #848E9C (muted gray)

**Semantic Colors:**
- Profit Green: #0ECB81 (used for positive values, buy actions)
- Loss Red: #F6465D (used for negative values, sell actions)
- Warning Yellow: #F0B90B (for alerts, pending states)
- Info Blue: #3861FB (for neutral information)
- Success Green Glow: #0ECB81 with 20% opacity for backgrounds
- Danger Red Glow: #F6465D with 20% opacity for backgrounds

**Bot Status Colors:**
- Active: #0ECB81
- Paused: #F0B90B
- Stopped: #848E9C
- Error: #F6465D

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 (p-4, gap-6, m-8)

**Dashboard Structure:**
- Sidebar Navigation: Fixed left (w-64), dark background (#161A1E)
- Main Content: Full-width flex container with padding (p-6 lg:p-8)
- Grid Layouts: grid-cols-1 md:grid-cols-2 xl:grid-cols-3 for bot cards
- Panel Spacing: gap-6 between major sections

---

## Component Library

### Navigation Sidebar
- Logo at top (h-16, centered)
- Navigation items with Heroicons (home, chart-bar, cog, clock)
- Active state: bg-background-tertiary + border-l-4 border-profit-green
- Account balance summary card at bottom (total equity, today's P&L)
- Logout button at very bottom

### Bot Management Cards

**Bot Status Card:**
- Large card (p-6, rounded-lg, bg-background-secondary)
- Top row: Bot name + status badge (rounded-full pill)
- Large P&L display (font-mono, text-3xl) with 24h percentage
- Small line chart showing P&L trend (Chart.js mini sparkline)
- Grid of key metrics: Total Trades, Win Rate, Avg Profit
- Bottom action buttons: Iniciar/Pausar/Parar (w-full for single, grid-cols-3 for multiple)
- Grid layout: grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6

**Strategy Configuration Panel:**
- Tabbed interface for different strategies (DCA, Grid Trading, RSI)
- Form inputs with floating labels (Portuguese)
- Numerical inputs with increment/decrement buttons
- Strategy preview visualization (grid levels, DCA schedule)
- Range sliders with value display for percentages
- Save/Reset buttons at bottom (justify-end)

### Control Components

**Action Buttons:**
- Primary: Iniciar Bot (bg-profit-green, text-black, h-12, font-semibold)
- Warning: Pausar Bot (bg-warning-yellow, text-black, h-12)
- Danger: Parar Bot (bg-loss-red, text-white, h-12)
- All buttons: rounded-lg, full-width on mobile, min-w-32 on desktop
- Blurred backgrounds when over images/charts (backdrop-blur-sm)

**Status Indicators:**
- Real-time connection: Small pulsing dot + "Conectado" text (top-right)
- Bot running indicator: Animated pulse effect on active badges
- API status: Badge with connection health (green/yellow/red)

### Data Visualization

**Performance Dashboard:**
- Large summary cards row: Total Profit, Today's P&L, Active Bots, Total Trades
- Main performance chart (h-96): Daily P&L line chart with gradient fill
- Time range selector: 24h, 7d, 30d, All (horizontal tabs)
- Asset allocation donut chart (Profit/Loss distribution)

**Trade History Table:**
- Full-width table with sticky header
- Columns: Data/Hora, Par, Tipo, Quantidade, Preço, Lucro/Perda
- Striped rows (even:bg-background-tertiary with 30% opacity)
- Sortable columns with arrow icons
- Profit/Loss column: colored text with + or - prefix
- Pagination at bottom (showing "1-20 de 150")
- Filter bar above table: date range picker, strategy filter, profit/loss filter

### Modals & Dialogs

**Bot Deletion Confirmation:**
- Centered modal (max-w-md)
- Warning icon (exclamation-triangle, text-loss-red, large)
- Bold question: "Tem certeza que deseja parar e deletar este bot?"
- Bot details recap (name, current P&L)
- Two-button footer: Cancelar (secondary), Deletar (danger red)

**Strategy Configuration Modal:**
- Larger modal (max-w-3xl)
- Two-column layout: Configuration form (left) + Preview visualization (right)
- Multi-step wizard for complex strategies
- Progress indicator at top
- Save as Template option
- Footer: Voltar, Salvar Rascunho, Ativar Bot

---

## Bot Dashboard Layout

**Main View Structure:**

1. **Top Stats Bar** (grid-cols-4 gap-4): Total Portfolio Value, Today's P&L, Active Bots, Win Rate
2. **Active Bots Section**: Grid of bot status cards (2-3 columns)
3. **Performance Chart Section**: Large chart with time range tabs
4. **Recent Activity**: Combined view of recent trades + bot actions (2-column split)

**Monitoring View:**
- Full-width bot performance chart
- Live order flow visualization (grid trading levels, DCA schedule)
- Real-time trade notifications (slide-in from right)
- Strategy parameter adjustments panel (right sidebar)

---

## Responsive Behavior

**Desktop (lg+):** 3-column bot grid, sidebar always visible, dual-panel layouts
**Tablet (md):** 2-column bot grid, collapsible sidebar, stacked panels
**Mobile:** Single column, bottom nav bar, full-width cards, simplified charts (h-64)

---

## Images

**No hero images.** This is a data monitoring application. Use:
- Cryptocurrency pair icons (24px circular avatars for BTC/USDT etc.)
- Strategy icons from Heroicons (chart-bar for Grid, clock for DCA, chart-line for RSI)
- Bot avatar placeholders (colored circles with initials for custom bots)

---

## Key Interactions

- Bot card click → Navigate to detailed monitoring view
- Strategy tab click → Smooth form transition with preview update
- Real-time P&L updates → Subtle number color flash on change
- Bot control buttons → Loading state during API calls, success confirmation toast
- Chart hover → Tooltip with exact values and timestamp
- Keyboard shortcuts: Space to pause/resume selected bot, Esc to close modals

**Animation Philosophy:** Minimal functional animations only - modal transitions (fade+scale), success confirmations (checkmark animation), error shakes. Real-time data updates use color flash, not movement.