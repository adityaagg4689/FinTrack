# FinTrack 💰

A full-stack personal finance platform to track income, expenses, budgets, savings goals, and recurring payments — with real-time analytics and a clean, responsive UI.

🔗 **[Live Demo](https://fintrack-3-mfkr.onrender.com/)** &nbsp;|&nbsp; 📦 **[GitHub](https://github.com/adityaagg4689/FinTrack)**

---

## Features

### 📊 Dashboard
- Monthly income vs. expenses summary with savings rate ring
- 7-day sparkline trends for income and expenses
- Quick stats: daily average spend, projected monthly spend, active goals
- Recent transactions carousel

### 💸 Transactions
- Add, edit, and delete income/expense transactions
- Filter by type (all / income / expense) and search by category or note
- Bulk select and delete up to 100 transactions at once
- Export filtered transactions to CSV
- Grouped by date with daily net totals
- Charts: category spending bar chart, expense donut, monthly income vs. expenses

### 🎯 Budgets
- Create monthly budgets per spending category
- Live spending tracked against each budget
- Visual progress bars with warning (80%+) and overspent states
- Budget health summary across all categories

### 🏆 Goals
- Create savings goals with target amount and deadline
- Add progress with optimistic UI updates
- Status tracking: Active, Urgent (< 30 days), Achieved, Overdue
- Daily savings needed calculation

### 🔄 Recurring Transactions
- Schedule recurring income/expenses (daily, weekly, monthly, yearly)
- Pause/resume individual items
- Upcoming bills view (next 30 days)
- Monthly recurring income vs. expense summary

---

## Tech Stack

**Frontend**
- React.js + Vite
- Zustand (state management)
- Tailwind CSS
- Recharts (data visualizations)
- Framer Motion

**Backend**
- Node.js + Express.js
- Supabase (PostgreSQL + Auth)
- JWT authentication
- express-rate-limit, CORS

**DevOps**
- Docker
- Render (deployment)

---

## Architecture

```
FinTrack/
├── Finance/
│   ├── client/                  # React frontend
│   │   ├── src/
│   │   │   ├── components/      # Dashboard, Transactions, Budgets, Goals, Recurring
│   │   │   ├── store/           # Zustand auth store
│   │   │   └── utils/           # API client, Supabase config
│   └── server/                  # Express backend
│       ├── config/              # Supabase admin config
│       ├── middleware/          # JWT auth middleware
│       └── server.js            # All API routes
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | Fetch transactions (filterable by date/type) |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| DELETE | `/api/transactions/bulk` | Bulk delete (max 100) |
| GET | `/api/budgets` | Fetch budgets with live spending |
| POST | `/api/budgets` | Create budget |
| PUT | `/api/budgets/:id` | Update budget |
| DELETE | `/api/budgets/:id` | Delete budget |
| GET | `/api/goals` | Fetch goals with progress |
| POST | `/api/goals` | Create goal |
| PUT | `/api/goals/:id` | Update goal |
| POST | `/api/goals/:id/progress` | Add progress to goal |
| DELETE | `/api/goals/:id` | Delete goal |
| GET | `/api/recurring` | Fetch recurring transactions |
| GET | `/api/recurring/upcoming` | Upcoming bills (next 30 days) |
| POST | `/api/recurring` | Create recurring transaction |
| PUT | `/api/recurring/:id` | Update recurring transaction |
| DELETE | `/api/recurring/:id` | Delete recurring transaction |
| GET | `/api/dashboard/summary` | Monthly summary stats |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Docker (optional)
- Supabase account

### Environment Variables

Create a `.env` file in `Finance/server/`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
PORT=5000
```

Create a `.env` file in `Finance/client/`:
```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Run Locally

```bash
# Clone the repo
git clone https://github.com/adityaagg4689/FinTrack.git
cd FinTrack/Finance

# Install and start backend
cd server
npm install
npm start

# Install and start frontend (new terminal)
cd ../client
npm install
npm run dev
```

### Run with Docker

```bash
cd FinTrack/Finance
docker build -t fintrack .
docker run -p 5000:5000 fintrack
```

---

## Database Schema

**Tables (Supabase/PostgreSQL)**
- `transactions` — id, user_id, amount, type, category, date, note
- `budgets` — id, user_id, category, amount, month, year
- `goals` — id, user_id, name, target_amount, current_amount, deadline
- `recurring_transactions` — id, user_id, name, amount, type, category, frequency, next_due_date, is_active

All tables are user-scoped — every query filters by `user_id` from the JWT token.

---

## Security
- JWT authentication via Supabase Auth on every protected route
- User-scoped database queries (no cross-user data access)
- Rate limiting: 100 requests per 15 minutes per IP
- CORS restricted to allowed origins
- Input validation on all POST/PUT endpoints

---
