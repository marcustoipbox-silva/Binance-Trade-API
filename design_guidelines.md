# Design Guidelines: Binance Trading System

## Design Approach

**Selected Approach:** Design System + Trading Platform Reference  
**Justification:** Trading platforms demand clarity, efficiency, and trust. Drawing inspiration from Binance, Coinbase Pro, and TradingView while implementing Material Design principles for consistent data visualization and interaction patterns.

**Core Principles:**
- Information hierarchy: Critical data (prices, balances) always visible
- Instant feedback: Real-time updates without page refreshes
- Trust signals: Professional aesthetics, clear status indicators
- Efficiency: Minimal clicks to execute trades

---

## Typography System

**Font Family:** Inter (via Google Fonts CDN)

**Hierarchy:**
- Page Headers: 24px, font-semibold (Dashboard, Orders, Portfolio)
- Section Headers: 18px, font-semibold (Market Overview, Order Book)
- Data Labels: 14px, font-medium (Asset names, order types)
- Data Values: 16px, font-mono (prices, quantities, percentages)
- Body Text: 14px, font-normal
- Small Text: 12px, font-normal (timestamps, helper text)

**Critical:** Use monospace font (font-mono) for all numerical data to ensure alignment and readability in tables.

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 (p-2, m-4, gap-6, h-8)

**Grid Structure:**
- Dashboard: Sidebar navigation (256px fixed) + Main content area (flex-1)
- Main area: 2-column layout on desktop (market data 60% + order panel 40%)
- Mobile: Single column stack, collapsible sidebar

**Container Strategy:**
- Full-width dashboard canvas
- Content sections: max-w-none (allow full data visibility)
- Modals/Forms: max-w-2xl centered

---

## Component Library

### Navigation
**Sidebar Navigation:**
- Fixed left sidebar (w-64)
- Logo/branding at top (h-16)
- Navigation items with icons (Heroicons)
- Active state: slight indent + border-l-4
- Balance summary at bottom
- Compact mode toggle for smaller screens

**Top Bar:**
- Account info and notifications (right-aligned)
- Quick market selector dropdown
- Connection status indicator (API connected/disconnected)

### Data Display Components

**Price Cards:**
- Large price display with 24h change percentage
- Compact symbol info with icon
- Sparkline chart (use Chart.js via CDN)
- Grid layout: grid-cols-2 md:grid-cols-4 gap-4

**Order Book:**
- Two-column table (bids/asks)
- Price levels with depth visualization bars
- Monospace numbers, right-aligned
- Sticky header row
- Max height with scroll (max-h-96 overflow-y-auto)

**Trading Chart:**
- Full-width candlestick chart (use Lightweight Charts library via CDN)
- Time interval selector (1m, 5m, 15m, 1h, 4h, 1D)
- Height: h-96 on desktop, h-64 on mobile

**Data Tables:**
- Striped rows for readability (even:bg-opacity-50)
- Sortable columns with icons
- Status badges (filled, cancelled, executed)
- Pagination controls at bottom
- Responsive: horizontal scroll on mobile

### Form Components

**Order Entry Panel:**
- Tab navigation (Market, Limit, Stop-Loss)
- Input fields with inline labels
- Quantity sliders with percentage buttons (25%, 50%, 75%, 100%)
- Large action buttons: "Buy" and "Sell" (h-12, full width)
- Order preview summary above submit

**Input Fields:**
- Floating labels for price/quantity inputs
- Right-aligned text for numerical inputs
- Unit indicators (BTC, USDT) inside input
- Error states with icon + message below

### Status & Feedback

**Status Badges:**
- Pill-shaped (rounded-full px-3 py-1)
- Size variants: text-xs, text-sm
- States: pending, filled, cancelled, expired

**Alerts/Notifications:**
- Toast notifications (top-right, fixed position)
- Icons from Heroicons (check-circle, exclamation-triangle)
- Auto-dismiss after 5 seconds
- Slide-in animation (optional, subtle)

**Loading States:**
- Skeleton screens for tables
- Spinner for real-time price updates
- Pulse animation for data refresh indicators

### Modals

**API Key Management Modal:**
- Centered overlay (max-w-md)
- Form with labeled inputs
- Password visibility toggle
- Warning text about security
- Two-button footer (Cancel + Save)

**Confirmation Dialogs:**
- Compact size (max-w-sm)
- Clear action description
- Highlighted critical info (order amount, price)
- Two-button footer with visual hierarchy

---

## Dashboard Layout Structure

**Main Dashboard View:**

1. **Top Bar** (h-16): Market selector, account info, notifications
2. **Content Area** (3-column grid on desktop):
   - Left: Order book + Recent trades (w-1/4)
   - Center: Trading chart + Order entry form (w-1/2)
   - Right: Positions + Order history (w-1/4)
3. **Bottom Panel** (collapsible): Active orders table (h-64)

**Portfolio View:**
- Asset cards grid (grid-cols-1 md:grid-cols-3 gap-6)
- Total balance summary card (highlighted, col-span-full)
- Asset allocation pie chart
- Performance chart (24h, 7d, 30d tabs)

**Order History View:**
- Filters bar (date range, status, symbol)
- Full-width table with all order details
- Export button (top-right)

---

## Responsive Behavior

**Desktop (lg and up):**
- Multi-column layouts active
- Sidebar always visible
- All panels accessible simultaneously

**Tablet (md):**
- 2-column layouts
- Collapsible sidebar
- Order entry form moves to modal

**Mobile (base):**
- Single column stack
- Bottom navigation bar replaces sidebar
- Swipeable tabs for different sections
- Simplified order entry (essential fields only)

---

## Animations

**Minimal, Purposeful Only:**
- Price change flash (quick opacity pulse on update)
- Modal enter/exit (fade + scale)
- Tab transitions (smooth content swap)
- **No hover effects, no complex animations**

---

## Images

**No hero images.** This is a data-dense application focused on functionality. Use:
- Cryptocurrency icons/logos from CoinGecko API or similar (16px, 24px sizes)
- Status icons from Heroicons throughout
- Chart visualizations generated by libraries

---

## Key Interaction Patterns

- Click asset card → Navigate to trading view for that pair
- Click order row → Expand with full details
- Quick trade buttons → Pre-fill order form with suggested values
- Real-time updates → Subtle visual indicator (pulse dot)
- Keyboard shortcuts → Numeric keypad for quick order entry

This design prioritizes clarity, speed, and trust—essential for financial applications where every millisecond and pixel matters.