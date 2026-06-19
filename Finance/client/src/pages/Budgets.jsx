import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import BudgetCard from './BudgetCard';
import BudgetForm from './BudgetForm';
const formatCurrency = (amount, showSign = false) => {
  // ✅ Guard against null, undefined, or non-numeric values
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  
  const absAmount = Math.abs(amount);
  const formatted = `₹${absAmount.toLocaleString('en-IN')}`;
  if (!showSign) return formatted;
  return `${amount >= 0 ? '+' : '−'}${formatted}`;
};

const Budgets = () => {
  const { user } = useAuthStore();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const syncCounterRef = useRef(0);
  const syncTimeoutRef = useRef(null);
  const isMounted = useRef(true);
  
  const currentDate = useMemo(() => new Date(), []);
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthName = months[currentMonth - 1];

 const fetchBudgets = useCallback(async () => {
  if (!user) return;

  setLoading(true);
  setError('');

  try {
    const response = await api.budgets.getAll({
      month: currentMonth,
      year: currentYear
    });
    
    const budgetsData = response.budgets || [];

    // ✅ Ensure all numeric fields are numbers
    const sanitizedBudgets = budgetsData.map(budget => ({
      ...budget,
      amount: parseFloat(budget.amount) || 0,
      spent: parseFloat(budget.spent) || 0,
      percentage: parseFloat(budget.percentage) || 0,
    }));

    if (isMounted.current) {
      setBudgets(sanitizedBudgets);
    }
  } catch (err) {
    console.error('Fetch budgets error:', err);
    if (isMounted.current) setError(err.message || 'Failed to fetch budgets');
  } finally {
    if (isMounted.current) setLoading(false);
  }
}, [user, currentMonth, currentYear]);
  // Real-time subscription with proper sync indicator handling
  useEffect(() => {
    if (!user) return;
    isMounted.current = true;
    fetchBudgets();

    // Note: Real-time subscriptions are handled by the backend
    // The backend already has the necessary logic for budget calculations
    // We just need to refresh periodically or when user interacts

    return () => {
      isMounted.current = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [user, fetchBudgets]);

  const handleCreateBudget = async ({ category, amount }) => {
    try {
      const response = await api.budgets.create({
        category,
        amount,
        month: currentMonth,
        year: currentYear
      });

      if (response.success) {
        setShowForm(false);
        fetchBudgets();
      } else {
        throw new Error(response.error || 'Failed to create budget');
      }
    } catch (err) {
      console.error('Create error:', err);
      throw err;
    }
  };

  const handleUpdateBudget = async ({ amount }) => {
    try {
      const response = await api.budgets.update(editingBudget.id, {
        category: editingBudget.category,
        amount,
        month: editingBudget.month,
        year: editingBudget.year
      });

      if (response.success) {
        setEditingBudget(null);
        fetchBudgets();
      } else {
        throw new Error(response.error || 'Failed to update budget');
      }
    } catch (err) {
      console.error('Update error:', err);
      throw err;
    }
  };

  const handleDeleteBudget = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this budget? This action cannot be undone.');
    if (!confirmed) return;
    
    setError('');
    try {
      const response = await api.budgets.delete(id);

      if (response.success) {
        fetchBudgets();
      } else {
        setError(response.error || 'Failed to delete budget');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete budget');
    }
  };

  const summary = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
    const totalRemaining = Math.max(0, totalBudget - totalSpent);
    const overspentCategories = budgets.filter(b => b.isOverBudget || b.percentage >= 100).length;
    const warningCategories = budgets.filter(b => b.percentage >= 80 && b.percentage < 100).length;
    const onTrackCategories = budgets.filter(b => b.percentage < 80).length;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overspentCategories,
      warningCategories,
      onTrackCategories,
      overallPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    };
  }, [budgets]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-300 dark:border-white/10"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-emerald-400 animate-spin"></div>
          </div>
          <p className="text-slate-500 dark:text-white/40 text-sm tracking-widest uppercase">Loading budgets</p>
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
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white px-4 md:px-8 py-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Sync Indicator */}
        {syncing && (
          <div className="fixed top-20 right-4 z-50 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs shadow-lg animate-pulse">
            Syncing with transactions...
          </div>
        )}

        {/* Header */}
        <div className="anim-1 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-slate-500 dark:text-white/30 text-xs tracking-[0.2em] uppercase mb-1">
              {currentMonthName} {currentYear}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Budget Planner <span className="inline-block">🎯</span>
            </h1>
            <p className="text-slate-500 dark:text-white/40 text-sm mt-1">Track your spending and stay on top of your finances</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchBudgets}
              className="text-sm px-4 py-2 rounded-xl bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/[0.08] transition-all text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-all font-medium text-white"
            >
              + Create Budget
            </button>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="anim-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💰</span>
              <p className="text-slate-500 dark:text-white/40 text-xs uppercase tracking-widest">Total Budget</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(summary.totalBudget)}</p>
            <p className="text-slate-500 dark:text-white/30 text-xs mt-2">Across {budgets.length} categories</p>
          </div>
          
          <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💸</span>
              <p className="text-slate-500 dark:text-white/40 text-xs uppercase tracking-widest">Total Spent</p>
            </div>
            <p className="text-2xl font-bold text-rose-400">{formatCurrency(summary.totalSpent)}</p>
            <p className="text-slate-500 dark:text-white/30 text-xs mt-2">{summary.overallPercentage.toFixed(1)}% of budget</p>
          </div>
          
          <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💚</span>
              <p className="text-slate-500 dark:text-white/40 text-xs uppercase tracking-widest">Remaining</p>
            </div>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(summary.totalRemaining)}</p>
            <p className="text-slate-500 dark:text-white/30 text-xs mt-2">Still available to spend</p>
          </div>
          
          <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📊</span>
              <p className="text-slate-500 dark:text-white/40 text-xs uppercase tracking-widest">Budget Health</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">{summary.onTrackCategories} on track</span>
              {summary.warningCategories > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">{summary.warningCategories} near limit</span>
              )}
              {summary.overspentCategories > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">{summary.overspentCategories} overspent</span>
              )}
            </div>
          </div>
        </div>

        {/* Current Period Card */}
        <div className="anim-3 relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-slate-100 dark:from-gray-900 dark:to-gray-950 border border-slate-200 dark:border-white/[0.07] p-6">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-blue-600/8 blur-2xl pointer-events-none" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl">📅</div>
              <div>
                <p className="text-slate-500 dark:text-white/40 text-xs tracking-[0.2em] uppercase">Current Budget Period</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{currentMonthName} {currentYear}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-500 dark:text-white/40">
                <span className="inline-flex items-center gap-1">⚡ Automatically tracking your spending this month</span>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-500 dark:text-white/40">Live updates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-8 text-center">
            <p className="text-rose-400">{error}</p>
            <button onClick={fetchBudgets} className="mt-4 px-4 py-2 bg-rose-500/20 rounded-xl text-rose-400 text-sm">Retry</button>
          </div>
        )}

        {/* Empty State */}
        {!error && budgets.length === 0 && (
          <div className="anim-4 rounded-3xl bg-white dark:bg-gray-900/60 border border-slate-200 dark:border-white/[0.07] p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Budgets Yet</h3>
            <p className="text-slate-500 dark:text-white/40 mb-6">
              Create your first budget for {currentMonthName} {currentYear} to start tracking your spending
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-medium"
            >
              Create Your First Budget
            </button>
          </div>
        )}

        {/* Budget Cards Grid */}
        {!error && budgets.length > 0 && (
          <div className="anim-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={() => setEditingBudget(budget)}
                onDelete={() => handleDeleteBudget(budget.id)}
              />
            ))}
          </div>
        )}

        {/* Forms */}
        {showForm && (
          <BudgetForm
            onSubmit={handleCreateBudget}
            onCancel={() => setShowForm(false)}
            existingCategories={budgets.map(b => b.category)}
            currentMonth={currentMonthName}
            currentYear={currentYear}
          />
        )}
        
        {editingBudget && (
          <BudgetForm
            initialData={editingBudget}
            onSubmit={handleUpdateBudget}
            onCancel={() => setEditingBudget(null)}
            isEditing
          />
        )}
      </div>
    </>
  );
};

export default Budgets;
