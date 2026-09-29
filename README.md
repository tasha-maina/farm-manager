# 🌾 Farm Manager — General Farm Record

A complete, offline-first mobile and desktop Farm Record application matching [smartfarmrecord.netlify.app](https://smartfarmrecord.netlify.app/).

## 🌟 Features

- **Dashboard**:
  - Live Net Worth calculation (Cash + Livestock + Assets - Loans)
  - Monthly Income, Monthly Expenses, and Net Profit
  - Real-time Livestock count
  - Top Activities and Recent Records feed
  - PWA Install prompt

- **➕ Add Record**:
  - General Farm Record Principle guide (Production, Operations, Expenses, Income)
  - Quick Templates: Buy Cow, Sell Milk, Buy Feed, Vet / Medicine, Sell Crops, Farm Labor, Buy Fertilizer, Equipment / Fuel, Eggs / Poultry, etc.
  - Manual Entry with dynamic auto-calculation for units, rates, and totals
  - Photo attachment with automatic client-side compression and preview

- **📋 All Records**:
  - Summary Bar (Income, Expenses, Net)
  - Instant Filter Chips (All, Production, Operations, Income, Dairy/Milk, Expenses, Livestock, Harvest, Loans)
  - Search and delete records

- **📊 Reports & Advice**:
  - Period Breakdown (Week, Month, Year)
  - Financial Health Indicator (Healthy, Average, Risky) with actionable recommendations
  - Income and Expense category breakdown bars
  - **🤖 AI Farm Advisor**: Generates a rich, structured prompt containing your exact farm data, cashflows, livestock, and debt to paste into ChatGPT, Claude, or Gemini for personalized agronomic and financial advice.

- **🐄 Assets & Livestock**:
  - Opening Capital (Starting cash, invested capital, start date)
  - Opening Assets Register (what you already had before recording)
  - Livestock Inventory (cows, bulls, calves, goats, sheep, pigs, poultry) with values and photos
  - Loan and liability tracker
  - Full Backup & Restore (CSV exports, complete JSON backup with photos, JSON restore)

- **🥛 Milk Credit Book**:
  - Milk delivery credit tracking (Morning, Evening, or Both)
  - Customer directory with custom rates per litre and delivery cycles (7, 14, 30 days)
  - Interactive 14-day delivery grid with quick daily logging
  - Overdue alerts and payment collection tracking (Cash, M-Pesa, Bank)
  - Customer statement and transaction ledger (last 30 days)
  - Day Cash Sales ledger for direct cash milk sales

- **📱 Offline PWA Support**:
  - Service Worker caching for complete offline functionality
  - Web App Manifest for mobile home screen installation

---

## 🚀 How to Run

### Option 1: Direct Standalone
Simply open [`index.html`](file:///home/dmintasha/farm-manager/index.html) in any web browser. No build steps or server required!

### Option 2: Vite Dev Server
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

### Option 3: Production Build
```bash
cd frontend
npm run build
```
The optimized production build is in `frontend/dist/`.

### Option 4: Deploy to Netlify / Vercel
Deploy either the root directory or `frontend/dist` directly as a static site.
