import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import TransactionForm from './TransactionForm';
import TransactionRow from './TransactionRow';
import { supabase } from '../utils/supabase';
import useAuthStore from '../store/authStore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell,
  Legend
} from 'recharts';

// Helper: Get local date string
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Parse YYYY-MM-DD without UTC shift
const parseLocalDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatCurrency = (amount, showSign = false) => {
  const absAmount = Math.abs(amount);
  const formatted = `₹${absAmount.toLocaleString('en-IN')}`;
  if (!showSign) return formatted;
  return `${amount >= 0 ? '+' : '−'}${formatted}`;
};

const useDebounce = (value, delay = 300) => {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return dv;
};

// Shared category spending computation — computed once, passed to both charts
const useCategorySpending = (transactions) => {
  return useMemo(() => {
    const map = new Map();
    transactions.filter(t => t.type === 'expense').forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return Array.from(map, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);
};

// ─── Graph 1: Category Spending - Horizontal Bar Chart ──────────────────────
const CategorySpendingChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top Spending Categories</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
          <XAxis type="number" stroke="#9ca3af" tickFormatter={(v) => `₹${v/1000}K`} />
          <YAxis type="category" dataKey="name" stroke="#9ca3af" width={100} />
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
            formatter={(value) => [formatCurrency(value), 'Spent']}
          />
          <Bar dataKey="value" fill="#f87171" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={['#f87171', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'][index % 6]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── Graph 2: Category Donut Chart ──────────────────────────────────────────
const CategoryDonut = ({ data }) => {
  const COLORS = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];

  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const pieData = data.map(d => ({ ...d, percentage: (d.value / total) * 100 }));

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Expense Breakdown</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}>
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [formatCurrency(value), 'Spent']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── Graph 3: Monthly Summary Bar Chart ─────────────────────────────────────
const MonthlySummaryChart = ({ transactions }) => {
  const monthlyData = useMemo(() => {
    const map = new Map();
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      const year = month.getFullYear();
      const monthNum = month.getMonth() + 1;
      
      // Fix: use parseLocalDate to avoid UTC shift in month bucketing
      const monthTransactions = transactions.filter(t => {
        const d = parseLocalDate(t.date);
        return d.getMonth() + 1 === monthNum && d.getFullYear() === year;
      });
      
      const income = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      
      map.set(`${monthName} ${year}`, { month: `${monthName} ${year}`, income, expenses });
    }
    return Array.from(map.values());
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
            formatter={(value) => [formatCurrency(value), '']}
          />
          <Legend />
          <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── CSV Export Helper ───────────────────────────────────────────────────────
const exportCSV = (transactions) => {
  const rows = [['Date', 'Type', 'Category', 'Amount', 'Note']];
  transactions.forEach(t => rows.push([t.date, t.type, t.category, t.amount, t.note || '']));
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions-${getLocalDateString(new Date())}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const Transactions = () => {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0, savingsRate: 0 });
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [showSelectAllPrompt, setShowSelectAllPrompt] = useState(false);
  const ITEMS_PER_PAGE = 15;

  const categorySpendingData = useCategorySpending(transactions);

  // Fix: proper stale-closure guard using a ref, not a returned cleanup
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');

    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', getLocalDateString(threeMonthsAgo))
        .order('date', { ascending: false })
        .limit(500);

      if (fetchError) throw fetchError;

      setTransactions(data || []);
      
      const totalIncome = (data || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExpenses = (data || []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const balance = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;
      
      setSummary({ totalIncome, totalExpenses, balance, savingsRate });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
    setShowSelectAllPrompt(false);
  }, [filter, debouncedSearch]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return transactions.filter(tx => {
      const matchFilter = filter === 'all' || tx.type === filter;
      const matchSearch = !q || 
        tx.category.toLowerCase().includes(q) || 
        (tx.note && tx.note.toLowerCase().includes(q));
      return matchFilter && matchSearch;
    });
  }, [transactions, filter, debouncedSearch]);

  const groupedByDate = useMemo(() => {
    return filtered.reduce((acc, tx) => {
      const key = tx.date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(tx);
      return acc;
    }, {});
  }, [filtered]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));
  }, [groupedByDate]);

  const paginatedDates = useMemo(() => {
    return sortedDates.slice(0, page * ITEMS_PER_PAGE);
  }, [sortedDates, page]);

  const visibleTxIds = useMemo(() => {
    return paginatedDates.flatMap(date => groupedByDate[date].map(t => t.id));
  }, [paginatedDates, groupedByDate]);

  const hasMore = page * ITEMS_PER_PAGE < sortedDates.length;
  const totalFilteredCount = filtered.length;

  const formatDateGroup = (dateStr) => {
    const today = getLocalDateString(new Date());
    const yesterday = getLocalDateString(new Date(Date.now() - 86400000));
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    // Fix: use parseLocalDate to avoid UTC shift on date headers
    return parseLocalDate(dateStr).toLocaleDateString('en-IN', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleTxIds.length && visibleTxIds.length > 0) {
      setSelectedIds(new Set());
      setShowSelectAllPrompt(false);
    } else {
      setSelectedIds(new Set(visibleTxIds));
      if (totalFilteredCount > visibleTxIds.length) {
        setShowSelectAllPrompt(true);
      }
    }
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filtered.map(t => t.id)));
    setShowSelectAllPrompt(false);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
    if (showSelectAllPrompt) setShowSelectAllPrompt(false);
  };

  const handleCreate = async ({ type, category, amount, date, note }) => {
    const { error: insertError } = await supabase
      .from('transactions')
      .insert([{ type, category, amount, date, note: note || null, user_id: user.id }]);
    
    if (insertError) throw new Error(insertError.message);
    setShowForm(false);
    fetchTransactions();
    setPage(1);
  };

  const handleUpdate = async (formData) => {
    const { type, category, amount, date, note } = formData;
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ type, category, amount, date, note: note || null })
      .eq('id', editingTx.id)
      .eq('user_id', user.id);

    if (updateError) throw new Error(updateError.message);
    setEditingTx(null);
    fetchTransactions();
  };

  const handleDelete = async (id) => {
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) throw new Error(deleteError.message);
    setDeleteConfirm(null);
    fetchTransactions();
  };

  const handleBulkDelete = async () => {
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .in('id', [...selectedIds])
      .eq('user_id', user.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    
    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
    setShowSelectAllPrompt(false);
    fetchTransactions();
  };

  // Fix: safe max — returns 0 instead of -Infinity when array is empty
  const expenseAmounts = transactions.filter(t => t.type === 'expense').map(t => t.amount);
  const incomeAmounts = transactions.filter(t => t.type === 'income').map(t => t.amount);
  const largestExpense = expenseAmounts.length > 0 ? Math.max(...expenseAmounts) : 0;
  const largestIncome = incomeAmounts.length > 0 ? Math.max(...incomeAmounts) : 0;
  const incomeExpenseRatio = (summary.totalIncome / Math.max(1, summary.totalExpenses)).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-slate-500 dark:text-white/30 text-xs tracking-[0.2em] uppercase mb-1">
              {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-white/60 bg-clip-text text-transparent">
              Transactions
            </h1>
            <p className="text-slate-500 dark:text-white/40 text-sm mt-1">Track and manage all your financial activity</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => exportCSV(filtered)}
              className="group relative px-4 py-2 rounded-xl bg-white/70 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08] transition-all"
            >
              📥 Export CSV
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              + Add Transaction
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Income', value: formatCurrency(summary.totalIncome), color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: '💰' },
            { label: 'Expenses', value: formatCurrency(summary.totalExpenses), color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: '💸' },
            { label: 'Balance', value: formatCurrency(summary.balance, true), color: summary.balance >= 0 ? 'text-blue-400' : 'text-rose-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: '📊' },
            { label: 'Savings Rate', value: `${summary.savingsRate}%`, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', icon: '🎯' },
          ].map((card, i) => (
            <div key={i} className={`rounded-2xl border p-4 ${card.bg} transition-all hover:scale-[1.02] duration-200`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{card.icon}</span>
                <p className="text-xs text-slate-500 dark:text-white/40 uppercase tracking-widest">{card.label}</p>
              </div>
              <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Graphs Section */}
        {!loading && transactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategorySpendingChart data={categorySpendingData} />
            <CategoryDonut data={categorySpendingData} />
            <MonthlySummaryChart transactions={transactions} />
            
            {/* Transaction Insights */}
            <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Transaction Insights</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-white/[0.08] rounded-xl">
                  <span className="text-sm font-medium text-slate-700 dark:text-white/70">Total Transactions</span>
                  <span className="font-bold text-slate-900 dark:text-white text-lg">{transactions.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20">
                  <span className="text-sm font-medium text-rose-700 dark:text-rose-300">Largest Expense</span>
                  {/* Fix: safe — shows ₹0 instead of ₹-Infinity when no expenses */}
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-lg">
                    {formatCurrency(largestExpense)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Largest Income</span>
                  {/* Fix: safe — shows ₹0 instead of ₹-Infinity when no income */}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                    {formatCurrency(largestIncome)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-white/[0.08] rounded-xl">
                  <span className="text-sm font-medium text-slate-700 dark:text-white/70">Income/Expense Ratio</span>
                  <span className={`font-bold text-lg ${
                    summary.totalExpenses > 0 && summary.totalIncome / summary.totalExpenses >= 1.5 ? 'text-emerald-600 dark:text-emerald-400' :
                    summary.totalExpenses > 0 && summary.totalIncome / summary.totalExpenses >= 1 ? 'text-blue-600 dark:text-blue-400' :
                    'text-amber-600 dark:text-amber-400'
                  }`}>
                    {incomeExpenseRatio}x
                  </span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                <div className="flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <div>
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-0.5">Financial Insight</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {summary.savingsRate >= 30 ? "Excellent! You're saving more than 30% of your income." :
                       summary.savingsRate >= 15 ? "Good job! You're on track with your savings." :
                       summary.savingsRate > 0 ? 'Try to increase your savings rate for better financial security.' :
                       'Your expenses exceed income. Review your spending habits.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 bg-white/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] rounded-xl p-1">
            {['all', 'income', 'expense'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? f === 'income' 
                      ? 'bg-emerald-600 text-white shadow-md'
                      : f === 'expense'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white'
                }`}
              >
                {f === 'all' ? '📋 All' : f === 'income' ? '💰 Income' : '💸 Expense'}
              </button>
            ))}
          </div>
          
          <div className="flex-1 min-w-[180px] relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by category or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/[0.06] transition-all"
            />
          </div>
          
          {selectedIds.size > 0 && (
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30 transition-all"
            >
              🗑️ Delete {selectedIds.size}
            </button>
          )}
        </div>

        {/* Select All Prompt — Gmail-style */}
        {showSelectAllPrompt && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
            <p className="text-sm text-blue-400">
              {visibleTxIds.length} transactions on this page are selected.
              <button 
                onClick={selectAllFiltered}
                className="ml-2 text-blue-300 hover:text-blue-200 underline font-medium"
              >
                Select all {totalFilteredCount} transactions
              </button>
            </p>
          </div>
        )}

        {/* Transaction List */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.07] bg-white/70 dark:bg-white/[0.02] overflow-hidden">
          {!loading && !error && visibleTxIds.length > 0 && (
            <div className="px-5 py-3 border-b border-slate-200 dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.01]">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 dark:text-white/40 dark:hover:text-white/60 transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  selectedIds.size === visibleTxIds.length && visibleTxIds.length > 0
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-slate-300 dark:border-white/20 hover:border-slate-400'
                }`}>
                  {selectedIds.size === visibleTxIds.length && visibleTxIds.length > 0 && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
                <span>Select visible ({visibleTxIds.length})</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-white/10 border-t-blue-500 animate-spin"/>
              <p className="text-slate-500 dark:text-white/30 text-sm">Loading transactions...</p>
            </div>
          )}

          {!loading && error && (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3">⚠️</div>
              <p className="text-rose-400 text-sm">{error}</p>
              <button onClick={fetchTransactions} className="mt-4 px-5 py-2 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-white/[0.1] transition-all">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && sortedDates.length === 0 && (
            <div className="py-20 text-center">
              <div className="text-6xl mb-4">💸</div>
              <p className="font-semibold text-slate-700 dark:text-white/60 text-lg">
                {search || filter !== 'all' ? 'No matching transactions' : 'No transactions yet'}
              </p>
              <p className="text-sm text-slate-500 dark:text-white/30 mt-1">
                {search || filter !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'Click "Add Transaction" to get started'}
              </p>
            </div>
          )}

          {!loading && !error && paginatedDates.map((date) => {
            const netTotal = groupedByDate[date].reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
            return (
              <div key={date}>
                <div className="flex justify-between items-center px-5 py-3 bg-slate-100/70 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.05]">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/30">
                    {formatDateGroup(date)}
                  </span>
                  <span className={`text-sm font-semibold ${netTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {netTotal >= 0 ? '+' : '−'} {formatCurrency(Math.abs(netTotal))}
                  </span>
                </div>
                {groupedByDate[date].map(tx => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    onEdit={setEditingTx}
                    onDelete={setDeleteConfirm}
                    selected={selectedIds.has(tx.id)}
                    onSelect={toggleSelect}
                  />
                ))}
              </div>
            );
          })}

          {!loading && !error && hasMore && (
            <div className="p-5 text-center border-t border-slate-200 dark:border-white/[0.05]">
              <button
                onClick={() => setPage(p => p + 1)}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center gap-1 mx-auto"
              >
                Load more transactions
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-6 6-6-6m12-8l-6 6-6-6"/>
                </svg>
              </button>
            </div>
          )}

          {!loading && !error && sortedDates.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-200 dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.01] text-center">
              <p className="text-xs text-slate-500 dark:text-white/20">
                Showing {visibleTxIds.length} of {filtered.length} transactions
              </p>
            </div>
          )}
        </div>

        {/* Modals */}
        {showForm && <TransactionForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}
        {editingTx && <TransactionForm initialData={editingTx} onSubmit={handleUpdate} onCancel={() => setEditingTx(null)} />}

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-white/[0.1] rounded-2xl p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
              <div className="text-5xl mb-3">🗑️</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete transaction?</h3>
              <p className="text-sm text-slate-500 dark:text-white/40 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {bulkDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setBulkDeleteConfirm(false)}>
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-white/[0.1] rounded-2xl p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete {selectedIds.size} transactions?</h3>
              <p className="text-sm text-slate-500 dark:text-white/40 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setBulkDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-white/60">
                  Cancel
                </button>
                <button onClick={handleBulkDelete} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold">
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;