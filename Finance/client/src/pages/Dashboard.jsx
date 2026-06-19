import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell,
  Legend
} from 'recharts';

// Helper: Get local date string without timezone issues
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Get start of day for accurate day comparison
const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper: Parse YYYY-MM-DD safely without UTC shift
const parseLocalDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatCurrency = (amount) => {
  const absAmount = Math.abs(amount);
  const formatted = `₹${absAmount.toLocaleString('en-IN')}`;
  if (amount >= 0) return formatted;
  return `-${formatted}`;
};

// Helper to calculate goal progress
const calculateGoalProgress = (goal) => {
  const today = new Date();
  const deadline = new Date(goal.deadline);
  const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  const percentage = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
  const isAchieved = goal.current_amount >= goal.target_amount;
  const isOverdue = daysLeft < 0 && percentage < 100;
  
  return {
    ...goal,
    percentage: Math.min(percentage, 100),
    daysLeft: Math.max(0, daysLeft),
    isAchieved,
    isOverdue,
    status: isAchieved ? 'achieved' : isOverdue ? 'overdue' : daysLeft < 30 ? 'urgent' : 'active'
  };
};

// ─── Graph 1: Income vs Expenses Monthly Bar Chart ──────────────────────────
const MonthlyComparisonChart = ({ transactions }) => {
  const monthlyData = useMemo(() => {
    const last6Months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      const year = month.getFullYear();
      const monthNum = month.getMonth() + 1;
      
      const monthTransactions = transactions.filter(t => {
        const tDate = parseLocalDate(t.date);
        return tDate.getMonth() + 1 === monthNum && tDate.getFullYear() === year;
      });
      
      const income = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      
      last6Months.push({ month: `${monthName} ${year}`, income, expenses });
    }
    return last6Months;
  }, [transactions]);

  if (monthlyData.every(d => d.income === 0 && d.expenses === 0)) return null;

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Monthly Income vs Expenses</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
          <YAxis stroke="#9ca3af" tickFormatter={(v) => `₹${v/1000}K`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
            formatter={(value) => [`₹${value.toLocaleString()}`, '']}
          />
          <Legend />
          <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── Category Donut ──────────────────────────────────────────────────────────
const CategoryDonut = ({ transactions }) => {
  const data = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    if (!total) return [];
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat, amt]) => ({ name: cat, value: amt, percentage: (amt / total) * 100 }));
  }, [transactions]);

  const COLORS = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];

  if (!data.length) return null;

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [formatCurrency(value), 'Spent']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── Spark Bar Component ───────────────────────────────────────────────────
const SparkBar = ({ data, color }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px] h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full opacity-80"
          style={{
            height: `${Math.max(4, (v / max) * 32)}px`,
            background: color,
            transition: `height 0.6s ease ${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
};

// ─── Transaction Pill ───────────────────────────────────────────────────────
const TxPill = ({ tx, index }) => {
  const isIncome = tx.type === 'income';
  const displayDate = parseLocalDate(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <div
      className="flex-shrink-0 w-56 rounded-2xl p-4 border border-slate-200 dark:border-white/[0.07] bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm"
      style={{ animation: `fadeSlideUp 0.4s ease ${index * 0.07}s both` }}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          isIncome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
        }`}>
          {isIncome ? 'INCOME' : 'EXPENSE'}
        </span>
        <span className="text-[11px] text-slate-500 dark:text-white/30">{displayDate}</span>
      </div>
      <p className="text-slate-900 dark:text-white font-semibold text-sm truncate">{tx.category}</p>
      <p className="text-slate-500 dark:text-white/40 text-xs mt-0.5 truncate">{tx.note || '—'}</p>
      <p className={`text-xl font-bold mt-3 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
      </p>
    </div>
  );
};

// ─── Main Dashboard Component ──────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0, savingsRate: 0 });
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [weeklyExpenses, setWeeklyExpenses] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [weeklyIncome, setWeeklyIncome] = useState([0, 0, 0, 0, 0, 0, 0]);
  const scrollRef = useRef(null);
  const isMounted = useRef(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // ✅ Fetch summary from dashboard endpoint
      const summaryResponse = await api.dashboard.getSummary();
      if (summaryResponse.success) {
        setSummary(summaryResponse.summary);
      }

      // ✅ Fetch transactions for charts
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const txResponse = await api.transactions.getAll({
        startDate: getLocalDateString(startOfMonth),
        endDate: getLocalDateString(endOfMonth)
      });
      const transactionsData = txResponse.transactions || [];
      setTransactions(transactionsData);

      // Calculate weekly buckets from transactions
      const expBuckets = Array(7).fill(0);
      const incBuckets = Array(7).fill(0);
      const today = getStartOfDay(now);
      
      transactionsData.forEach(t => {
        const txDate = getStartOfDay(parseLocalDate(t.date));
        const diffTime = today - txDate;
        const dayOffset = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (dayOffset >= 0 && dayOffset < 7) {
          if (t.type === 'expense') expBuckets[6 - dayOffset] += t.amount;
          else incBuckets[6 - dayOffset] += t.amount;
        }
      });
      setWeeklyExpenses(expBuckets);
      setWeeklyIncome(incBuckets);

      // ✅ Fetch goals
      const goalsResponse = await api.goals.getAll();
      const goalsData = goalsResponse.goals || [];
      setGoals(goalsData);

      // ✅ Fetch recent transactions (8 most recent)
      const recentResponse = await api.transactions.getAll({ limit: 8 });
      const recentData = recentResponse.transactions || [];
      setRecentTransactions(recentData);

    } catch (err) {
      console.error('Fetch error:', err);
      if (isMounted.current) setError(err.message || 'Failed to load dashboard');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    isMounted.current = true;
    fetchDashboardData();

    return () => {
      isMounted.current = false;
    };
  }, [fetchDashboardData]);

  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'there';
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const todayDate = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const incomeBarWidth = summary.totalIncome > 0 ? 100 : 0;
  const expenseBarWidth = summary.totalIncome > 0
    ? Math.min(100, (summary.totalExpenses / summary.totalIncome) * 100)
    : 0;
  const spentPercent = summary.totalIncome > 0
    ? Math.round((summary.totalExpenses / summary.totalIncome) * 100)
    : 0;

  const avgDailySpend = summary.totalExpenses / Math.max(1, todayDate);
  const projectedMonthly = avgDailySpend * daysInMonth;

  const activeGoalsCount = goals.filter(g => !calculateGoalProgress(g).isAchieved).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-300 dark:border-white/10"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-blue-400 animate-spin"></div>
          </div>
          <p className="text-slate-500 dark:text-white/40 text-sm tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
        <div className="text-center p-8">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-500 dark:text-white/40 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-1 { animation: fadeSlideUp 0.5s ease 0.05s both; }
        .anim-2 { animation: fadeSlideUp 0.5s ease 0.15s both; }
        .anim-3 { animation: fadeSlideUp 0.5s ease 0.25s both; }
        .anim-4 { animation: fadeSlideUp 0.5s ease 0.35s both; }
        .scroll-hide::-webkit-scrollbar { display: none; }
        .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white px-4 md:px-8 py-8 space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="anim-1 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-slate-500 dark:text-white/30 text-xs tracking-[0.2em] uppercase mb-1">{month}</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Hey, {name} <span className="inline-block">👋</span>
            </h1>
            <p className="text-slate-500 dark:text-white/40 text-sm mt-1">Here's where your money stands today.</p>
          </div>
          <div className="flex gap-3">
            <a href="/transactions" className="text-sm px-4 py-2 rounded-xl bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/[0.08] transition-all text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white">
              + Add Transaction
            </a>
            <a href="/budgets" className="text-sm px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition-all font-medium text-white">
              Manage Budgets
            </a>
          </div>
        </div>

        {/* Hero Row - Balance Card + Savings Ring */}
        <div className="anim-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Balance hero card */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-slate-100 dark:from-gray-900 dark:to-gray-950 border border-slate-200 dark:border-white/[0.07] p-8">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-purple-600/8 blur-2xl pointer-events-none" />
            <div className="relative flex flex-col h-full">
              <p className="text-slate-500 dark:text-white/40 text-xs tracking-[0.2em] uppercase mb-3">Net Balance</p>
              <div className="flex items-end gap-4 mb-8">
                <p className={`text-6xl md:text-7xl font-bold tracking-tighter leading-none ${
                  summary.balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-400'
                }`}>
                  {formatCurrency(summary.balance)}
                </p>
                <span className={`mb-2 text-sm font-medium px-2 py-0.5 rounded-full ${
                  summary.balance >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {summary.balance >= 0 ? '▲ Positive' : '▼ Deficit'}
                </span>
              </div>

              <div className="space-y-3 mt-auto">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-400 font-medium">↑ Income</span>
                    <span className="text-slate-500 dark:text-white/40 tabular-nums">{formatCurrency(summary.totalIncome)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000"
                      style={{ width: `${incomeBarWidth}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-rose-400 font-medium">↓ Expenses</span>
                    <span className="text-slate-500 dark:text-white/40 tabular-nums">
                      {formatCurrency(summary.totalExpenses)}
                      <span className="ml-1.5 opacity-60">({spentPercent}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-1000"
                      style={{ width: `${expenseBarWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Savings ring card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-slate-100 dark:from-gray-900 dark:to-gray-950 border border-slate-200 dark:border-white/[0.07] p-8 flex flex-col">
            <p className="text-slate-500 dark:text-white/40 text-xs tracking-[0.2em] uppercase mb-6">Savings Rate</p>
            <div className="flex-1 flex flex-col items-center justify-center gap-5">
              <div className="relative">
                <svg width="128" height="128" viewBox="0 0 128 128" className="rotate-[-90deg]">
                  <circle cx="64" cy="64" r="54" fill="none" stroke="currentColor" className="text-slate-300 dark:text-white/10" strokeWidth="10" />
                  <circle cx="64" cy="64" r="54" fill="none"
                    stroke={summary.savingsRate >= 30 ? '#34d399' : summary.savingsRate >= 10 ? '#fbbf24' : '#f87171'}
                    strokeWidth="10" strokeDasharray="339.292"
                    strokeDashoffset={339.292 - (Math.max(0, summary.savingsRate) / 100) * 339.292}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{summary.savingsRate}%</span>
                  <span className="text-[10px] text-slate-500 dark:text-white/30 uppercase tracking-wider">saved</span>
                </div>
              </div>
              <p className="text-center text-sm text-slate-500 dark:text-white/40 leading-relaxed">
                {summary.savingsRate >= 30 ? '🏆 Excellent savings discipline' :
                 summary.savingsRate >= 15 ? '📈 On track — keep it up' :
                 summary.savingsRate >= 0 ? '⚠️ Try to save more this month' : '🔴 Spending exceeds income'}
              </p>
            </div>
          </div>
        </div>

        {/* Stat Cards Row with Spark Bars */}
        <div className="anim-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Income', value: formatCurrency(summary.totalIncome), sub: 'This month', spark: weeklyIncome, color: '#34d399' },
            { label: 'Expenses', value: formatCurrency(summary.totalExpenses), sub: 'This month', spark: weeklyExpenses, color: '#f87171' },
            { label: 'Daily Avg', value: formatCurrency(avgDailySpend), sub: `Over ${todayDate} days`, spark: weeklyExpenses, color: '#fbbf24' },
            { label: 'Net', value: summary.balance >= 0 ? `+${formatCurrency(summary.balance)}` : formatCurrency(summary.balance), sub: 'This month', spark: weeklyIncome.map((v, i) => Math.max(0, v - weeklyExpenses[i])), color: '#818cf8' },
          ].map((card, i) => (
            <div key={i} className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all">
              <p className="text-slate-500 dark:text-white/40 text-xs uppercase tracking-widest mb-3">{card.label}</p>
              <p className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">{card.value}</p>
              <p className="text-slate-500 dark:text-white/30 text-xs mb-4">{card.sub}</p>
              <SparkBar data={card.spark} color={card.color} />
            </div>
          ))}
        </div>

        {/* Graphs Grid */}
        <div className="anim-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyComparisonChart transactions={transactions} />
          <CategoryDonut transactions={transactions} />

          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Transactions', value: transactions.length },
                { label: 'Active Goals', value: activeGoalsCount },
                { label: 'Avg Daily Spend', value: formatCurrency(avgDailySpend) },
                { label: 'Projected Monthly', value: formatCurrency(projectedMonthly) },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-slate-50 dark:bg-white/[0.03] rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-white/40 uppercase tracking-widest mb-2">{item.label}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="anim-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-slate-700 dark:text-white/80 text-sm tracking-wide">Recent Transactions</h2>
            <a href="/transactions" className="text-blue-400 text-xs hover:underline">View all →</a>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-10 text-center text-slate-500 dark:text-white/30 text-sm">
              No transactions yet — add one to get started!
            </div>
          ) : (
            <div ref={scrollRef} className="flex gap-3 overflow-x-auto scroll-hide pb-2">
              {recentTransactions.map((tx, i) => <TxPill key={tx.id} tx={tx} index={i} />)}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="anim-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/transactions" className="group block rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/20 p-5 transition-all hover:bg-slate-50 dark:hover:bg-gray-900">
            <div className="flex items-center gap-4">
              <span className="text-3xl">📝</span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-400 transition-colors">Add Transaction</p>
                <p className="text-slate-500 dark:text-white/40 text-xs mt-0.5">Record income or expense</p>
              </div>
              <span className="ml-auto text-slate-400 dark:text-white/20 group-hover:text-slate-700 dark:group-hover:text-white/60 transition-colors text-lg">→</span>
            </div>
          </a>
          <a href="/budgets" className="group block rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/20 p-5 transition-all hover:bg-slate-50 dark:hover:bg-gray-900">
            <div className="flex items-center gap-4">
              <span className="text-3xl">🎯</span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-400 transition-colors">Set Budget</p>
                <p className="text-slate-500 dark:text-white/40 text-xs mt-0.5">Control your spending</p>
              </div>
              <span className="ml-auto text-slate-400 dark:text-white/20 group-hover:text-slate-700 dark:group-hover:text-white/60 transition-colors text-lg">→</span>
            </div>
          </a>
          <a href="/goals" className="group block rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/20 p-5 transition-all hover:bg-slate-50 dark:hover:bg-gray-900">
            <div className="flex items-center gap-4">
              <span className="text-3xl">🏆</span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-400 transition-colors">Create Goal</p>
                <p className="text-slate-500 dark:text-white/40 text-xs mt-0.5">Save for something special</p>
              </div>
              <span className="ml-auto text-slate-400 dark:text-white/20 group-hover:text-slate-700 dark:group-hover:text-white/60 transition-colors text-lg">→</span>
            </div>
          </a>
        </div>
      </div>
    </>
  );
};

export default Dashboard;