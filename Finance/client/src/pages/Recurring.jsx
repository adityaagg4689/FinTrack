import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import RecurringForm from './RecurringForm';
import ConfirmModal from './ConfirmModal';

// Helper: Get local date string (YYYY-MM-DD) without timezone issues
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

const formatCurrency = (amount) => `₹${Math.round(Math.abs(amount)).toLocaleString('en-IN')}`;

const Recurring = () => {
  const { user } = useAuthStore();
  const [recurringItems, setRecurringItems] = useState([]);
  const [upcomingTransactions, setUpcomingTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filter, setFilter] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const isMounted = useRef(true);
  const debounceTimerRef = useRef(null);

  // Debounced refresh - fixed with useRef
  const debouncedRefresh = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      if (isMounted.current) {
        setRefreshTrigger(prev => prev + 1);
      }
    }, 300);
  }, []);

  // Calculate accurate monthly amount from frequency
  const calculateMonthlyAmount = (amount, frequency) => {
    if (frequency === 'monthly') return amount;
    if (frequency === 'weekly') return amount * 52 / 12;
    if (frequency === 'yearly') return amount / 12;
    if (frequency === 'daily') return amount * 365 / 12;
    return amount;
  };

  // Fetch all recurring transactions
  const fetchRecurring = useCallback(async () => {
    if (!user) return;

    try {
      const response = await api.recurring.getAll();
      const data = response.recurring || [];

      if (isMounted.current) {
        setRecurringItems(data);
        setError('');
      }
    } catch (err) {
      console.error('Fetch recurring error:', err);
      if (isMounted.current) setError(err.message || 'Failed to fetch recurring transactions');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [user]);

  // Fetch upcoming transactions (both income and expense)
  const fetchUpcomingTransactions = useCallback(async () => {
    if (!user) return;

    try {
      const response = await api.recurring.getUpcoming();
      const data = response.upcomingBills || [];

      // Fix: Parse dates with parseLocalDate for correct IST display
      const transactionsWithDays = data.map(transaction => {
        const dueDate = parseLocalDate(transaction.next_due_date);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((dueDate - todayDate) / (1000 * 60 * 60 * 24));
        return { ...transaction, daysUntil: Math.max(0, daysUntil) };
      });

      if (isMounted.current) {
        setUpcomingTransactions(transactionsWithDays);
      }
    } catch (err) {
      console.error('Error fetching upcoming transactions:', err);
    }
  }, [user]);

  // Combined data fetch
  const loadAllData = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    await Promise.all([fetchRecurring(), fetchUpcomingTransactions()]);
    if (isMounted.current) {
      setLoading(false);
    }
  }, [fetchRecurring, fetchUpcomingTransactions]);

  // Fixed: Only run on mount and refreshTrigger changes
  useEffect(() => {
    isMounted.current = true;
    loadAllData();

    return () => {
      isMounted.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [loadAllData, refreshTrigger]);

  const handleCreate = async ({ name, amount, type, category, frequency, next_due_date }) => {
    try {
      const response = await api.recurring.create({
        name,
        amount,
        type,
        category,
        frequency,
        next_due_date: next_due_date || getLocalDateString(new Date())
      });

      if (response.success) {
        setShowForm(false);
        debouncedRefresh();
      } else {
        throw new Error(response.error || 'Failed to create recurring transaction');
      }
    } catch (err) {
      console.error('Create error:', err);
      throw err;
    }
  };

  const handleUpdate = async ({ name, amount, type, category, frequency, next_due_date }) => {
    try {
      const response = await api.recurring.update(editingItem.id, {
        name,
        amount,
        type,
        category,
        frequency,
        next_due_date
      });

      if (response.success) {
        setEditingItem(null);
        debouncedRefresh();
      } else {
        throw new Error(response.error || 'Failed to update recurring transaction');
      }
    } catch (err) {
      console.error('Update error:', err);
      throw err;
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const item = recurringItems.find(i => i.id === id);
      if (!item) return;

      const response = await api.recurring.update(id, {
        name: item.name,
        amount: item.amount,
        type: item.type,
        category: item.category,
        frequency: item.frequency,
        next_due_date: item.next_due_date,
        is_active: !currentStatus
      });

      if (response.success) {
        debouncedRefresh();
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      setError(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      const response = await api.recurring.delete(id);

      if (response.success) {
        setDeleteConfirm(null);
        debouncedRefresh();
      } else {
        setError(response.error || 'Failed to delete recurring transaction');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete recurring transaction');
    }
  };

  const filteredItems = recurringItems.filter(item => {
    if (filter === 'active') return item.is_active;
    if (filter === 'paused') return !item.is_active;
    return true;
  });

  const monthlyTotal = recurringItems
    .filter(item => item.is_active && item.type === 'expense')
    .reduce((sum, item) => sum + calculateMonthlyAmount(item.amount, item.frequency), 0);

  const monthlyIncome = recurringItems
    .filter(item => item.is_active && item.type === 'income')
    .reduce((sum, item) => sum + calculateMonthlyAmount(item.amount, item.frequency), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-300 dark:border-white/10"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-purple-400 animate-spin"></div>
          </div>
          <p className="text-slate-500 dark:text-white/40 text-sm tracking-widest uppercase">Loading recurring</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-white px-4 md:px-8 py-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-slate-500 dark:text-white/30 text-xs tracking-[0.2em] uppercase mb-1">
            Automation
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Recurring <span className="inline-block">🔄</span>
          </h1>
          <p className="text-slate-500 dark:text-white/40 text-sm mt-1">Automate your regular payments and income</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadAllData}
            className="text-sm px-4 py-2 rounded-xl bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/[0.08] transition-all text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 transition-all font-medium text-white"
          >
            + Add Recurring
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📤</span>
            <p className="text-slate-500 dark:text-white/40 text-xs uppercase tracking-widest">Monthly Expenses</p>
          </div>
          <p className="text-2xl font-bold text-rose-400">{formatCurrency(monthlyTotal)}</p>
          <p className="text-slate-500 dark:text-white/30 text-xs mt-2">From active recurring payments</p>
        </div>
        
        <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💰</span>
            <p className="text-slate-500 dark:text-white/40 text-xs uppercase tracking-widest">Monthly Income</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(monthlyIncome)}</p>
          <p className="text-slate-500 dark:text-white/30 text-xs mt-2">From active recurring income</p>
        </div>
        
        <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⚡</span>
            <p className="text-slate-500 dark:text-white/40 text-xs uppercase tracking-widest">Net Monthly</p>
          </div>
          <p className={`text-2xl font-bold ${monthlyIncome - monthlyTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(monthlyIncome - monthlyTotal)}
          </p>
          <p className="text-slate-500 dark:text-white/30 text-xs mt-2">After all recurring transactions</p>
        </div>
      </div>

      {/* Upcoming Transactions Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>📅</span> Upcoming Transactions (30 days)
            <span className="text-sm font-normal text-slate-500 dark:text-white/40">({upcomingTransactions.length})</span>
          </h2>
        </div>
        
        {upcomingTransactions.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200 dark:border-white/[0.07] p-8 text-center">
            <p className="text-slate-500 dark:text-white/40">No upcoming transactions in the next 30 days 🎉</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTransactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className={`rounded-2xl bg-white dark:bg-gray-900/80 border-l-4 p-4 hover:border-l-4 transition-all ${
                  transaction.type === 'expense' 
                    ? 'border-l-rose-500 hover:shadow-lg hover:shadow-rose-500/10' 
                    : 'border-l-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10'
                } border border-slate-200 dark:border-white/[0.07]`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{transaction.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">{transaction.category}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${transaction.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {transaction.type === 'expense' ? '-' : '+'} {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-white/40 capitalize">{transaction.frequency}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">📅</span>
                    <span className="text-sm text-slate-600 dark:text-white/60">
                      {parseLocalDate(transaction.next_due_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    transaction.daysUntil === 0 ? 'bg-rose-500/20 text-rose-400' :
                    transaction.daysUntil <= 3 ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {transaction.daysUntil === 0 ? 'Due Today!' : `${transaction.daysUntil} days left`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'All', icon: '📋' },
          { id: 'active', label: 'Active', icon: '✅' },
          { id: 'paused', label: 'Paused', icon: '⏸️' }
        ].map(filterOption => (
          <button
            key={filterOption.id}
            onClick={() => setFilter(filterOption.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === filterOption.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {filterOption.icon} {filterOption.label}
          </button>
        ))}
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {error ? (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-6 text-center">
            <p className="text-rose-400">{error}</p>
            <button onClick={loadAllData} className="mt-3 px-4 py-2 bg-rose-500/20 rounded-xl text-rose-400 text-sm">Retry</button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200 dark:border-white/[0.07] p-8 text-center">
            <div className="text-5xl mb-3">🔄</div>
            <p className="text-slate-500 dark:text-white/40">No recurring transactions yet</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.type === 'income' ? '💰' : '💸'}</span>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-white/40">{item.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleStatus(item.id, item.is_active)}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.is_active 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-slate-500/20 text-slate-400'
                  }`}
                >
                  {item.is_active ? 'Active' : 'Paused'}
                </button>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200 dark:border-white/10">
                <div className="text-sm text-slate-500 dark:text-white/40 capitalize">{item.frequency}</div>
                <div className={`font-semibold ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-3 pt-2 border-t border-slate-200 dark:border-white/10">
                <button onClick={() => setEditingItem(item)} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Edit</button>
                <button onClick={() => setDeleteConfirm(item.id)} className="text-sm text-rose-400 hover:text-rose-300 transition-colors">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-2xl bg-white dark:bg-gray-900/60 border border-slate-200 dark:border-white/[0.07] overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-rose-400">{error}</p>
            <button onClick={loadAllData} className="mt-3 px-4 py-2 bg-rose-500/20 rounded-xl text-rose-400 text-sm">Retry</button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Recurring Transactions</h3>
            <p className="text-slate-500 dark:text-white/40">Click "Add Recurring" to automate your finances</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100/50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.05]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">Next Due</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/[0.05]">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.type === 'income' ? '💰' : '💸'}</span>
                        <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-white/60">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize text-slate-600 dark:text-white/60">{item.frequency}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-600 dark:text-white/60">
                      {parseLocalDate(item.next_due_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleStatus(item.id, item.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          item.is_active 
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30'
                        }`}
                      >
                        {item.is_active ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingItem(item)} className="p-1 text-blue-400 hover:text-blue-300 transition-colors" title="Edit">✏️</button>
                        <button onClick={() => setDeleteConfirm(item.id)} className="p-1 text-rose-400 hover:text-rose-300 transition-colors" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Forms & Modals */}
      {showForm && (
        <RecurringForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingItem && (
        <RecurringForm
          initialData={editingItem}
          onSubmit={handleUpdate}
          onCancel={() => setEditingItem(null)}
          isEditing={true}
        />
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Recurring Transaction"
          message="Are you sure you want to delete this recurring transaction? This will not affect past transactions already recorded."
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

export default Recurring;