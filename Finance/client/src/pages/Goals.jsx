import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import GoalCard from './GoalCard';
import GoalForm from './GoalForm';
import GoalInsights from './GoalInsights';
import ConfirmModal from './ConfirmModal';

const formatCurrency = (amount) => `₹${Math.abs(amount).toLocaleString('en-IN')}`;

const Goals = () => {
  const { user } = useAuthStore();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [progressAmount, setProgressAmount] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [optimisticUpdate, setOptimisticUpdate] = useState(false);
  const progressTimeoutRef = useRef(null);
  const isMounted = useRef(true);

  // Helper to calculate goal progress
  const calculateGoalProgress = useCallback((goal) => {
    const today = new Date();
    const deadline = new Date(goal.deadline);
    const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    const percentage = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
    const dailyNeeded = daysLeft > 0 && !goal.isAchieved 
      ? (goal.target_amount - goal.current_amount) / daysLeft 
      : 0;
    const isOverdue = daysLeft < 0 && percentage < 100;
    const isAchieved = goal.current_amount >= goal.target_amount;

    let statusColorClass = '';
    let statusBgClass = '';
    let statusIcon = '';
    let statusText = '';
    let gradientClass = '';

    if (isAchieved) {
      statusColorClass = 'text-emerald-400';
      statusBgClass = 'bg-emerald-500/20';
      statusIcon = '🏆';
      statusText = 'Achieved!';
      gradientClass = 'from-emerald-500 to-emerald-600';
    } else if (isOverdue) {
      statusColorClass = 'text-rose-400';
      statusBgClass = 'bg-rose-500/20';
      statusIcon = '⚠️';
      statusText = 'Overdue';
      gradientClass = 'from-rose-500 to-rose-600';
    } else if (daysLeft < 30) {
      statusColorClass = 'text-amber-400';
      statusBgClass = 'bg-amber-500/20';
      statusIcon = '🔥';
      statusText = 'Urgent';
      gradientClass = 'from-amber-500 to-amber-600';
    } else {
      statusColorClass = 'text-blue-400';
      statusBgClass = 'bg-blue-500/20';
      statusIcon = '📈';
      statusText = 'In Progress';
      gradientClass = 'from-blue-500 to-blue-600';
    }

    return {
      daysLeft: Math.max(0, daysLeft),
      percentage: Math.min(percentage, 100),
      dailyNeeded: Math.max(0, dailyNeeded),
      isOverdue,
      isAchieved,
      statusColorClass,
      statusBgClass,
      statusIcon,
      statusText,
      gradientClass
    };
  }, []);

  // Fetch goals from backend
  const fetchGoals = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.goals.getAll();
      const data = response.goals || [];

      const goalsWithProgress = data.map(goal => ({
        ...goal,
        ...calculateGoalProgress(goal)
      }));

      if (isMounted.current) {
        setGoals(goalsWithProgress);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message || 'Failed to fetch goals');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [user, calculateGoalProgress]);

  useEffect(() => {
    isMounted.current = true;
    fetchGoals();

    return () => {
      isMounted.current = false;
    };
  }, [fetchGoals]);

  const handleCreateGoal = async ({ name, target_amount, deadline }) => {
    try {
      const response = await api.goals.create({
        name,
        target_amount,
        deadline
      });

      if (response.success) {
        setShowForm(false);
        fetchGoals();
      } else {
        throw new Error(response.error || 'Failed to create goal');
      }
    } catch (err) {
      console.error('Create error:', err);
      throw err;
    }
  };

  const handleUpdateGoal = async ({ name, target_amount, deadline }) => {
    try {
      const response = await api.goals.update(editingGoal.id, {
        name,
        target_amount,
        deadline
      });

      if (response.success) {
        setEditingGoal(null);
        fetchGoals();
      } else {
        throw new Error(response.error || 'Failed to update goal');
      }
    } catch (err) {
      console.error('Update error:', err);
      throw err;
    }
  };

  const handleAddProgress = async () => {
    if (!selectedGoal || !progressAmount) return;

    const amount = parseFloat(progressAmount);
    
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    const remainingNeeded = selectedGoal.target_amount - selectedGoal.current_amount;
    if (amount > remainingNeeded) {
      alert(`Amount exceeds remaining target. You only need ${formatCurrency(remainingNeeded)} more!`);
      return;
    }

    const newAmount = selectedGoal.current_amount + amount;

    setOptimisticUpdate(true);
    const previousGoals = [...goals];
    
    setGoals(prev => prev.map(g => 
      g.id === selectedGoal.id 
        ? { ...g, current_amount: newAmount, ...calculateGoalProgress({ ...g, current_amount: newAmount }) }
        : g
    ));

    if (progressTimeoutRef.current) {
      clearTimeout(progressTimeoutRef.current);
    }

    setShowProgressModal(false);
    setProgressAmount('');
    setSelectedGoal(null);

    try {
      const response = await api.goals.addProgress(selectedGoal.id, amount);

      if (!response.success) {
        setGoals(previousGoals);
        alert('Error updating progress: ' + (response.error || 'Unknown error'));
      }
    } catch (err) {
      setGoals(previousGoals);
      alert('Error updating progress: ' + err.message);
    }
    
    setOptimisticUpdate(false);
  };

  const handleDeleteGoal = async (id) => {
    setError('');
    try {
      const response = await api.goals.delete(id);

      if (response.success) {
        setShowDeleteConfirm(null);
        fetchGoals();
      } else {
        setError(response.error || 'Failed to delete goal');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete goal');
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (activeFilter === 'active') return !goal.isAchieved && !goal.isOverdue;
    if (activeFilter === 'achieved') return goal.isAchieved;
    if (activeFilter === 'urgent') return !goal.isAchieved && goal.daysLeft < 30;
    return true;
  });

  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const activeGoals = goals.filter(g => !g.isAchieved).length;
  const achievedGoals = goals.filter(g => g.isAchieved).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-300 dark:border-white/10"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-emerald-400 animate-spin"></div>
          </div>
          <p className="text-slate-500 dark:text-white/40 text-sm tracking-widest uppercase">Loading goals</p>
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
        
        {/* Header */}
        <div className="anim-1 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-slate-500 dark:text-white/30 text-xs tracking-[0.2em] uppercase mb-1">
              Savings Goals
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Goals <span className="inline-block">🎯</span>
            </h1>
            <p className="text-slate-500 dark:text-white/40 text-sm mt-1">Track your progress towards financial freedom</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchGoals}
              className="text-sm px-4 py-2 rounded-xl bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/[0.08] transition-all text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => setShowForm(true)}
              disabled={optimisticUpdate}
              className="text-sm px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-all font-medium text-white disabled:opacity-50"
            >
              + Create Goal
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="anim-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💰</span>
              <p className="text-slate-500 dark:text-white/40 text-xs uppercase tracking-widest">Total Saved</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalSaved)}</p>
            <p className="text-slate-500 dark:text-white/30 text-xs mt-2">Across {goals.length} goals</p>
          </div>
          
          <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🎯</span>
              <p className="text-slate-500 dark:text-white/40 text-xs uppercase tracking-widest">Total Target</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalTarget)}</p>
            <p className="text-slate-500 dark:text-white/30 text-xs mt-2">Overall savings goal</p>
          </div>
          
          <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📊</span>
              <p className="text-slate-500 dark:text-white/40 text-xs uppercase tracking-widest">Active Goals</p>
            </div>
            <p className="text-2xl font-bold text-blue-400">{activeGoals}</p>
            <p className="text-slate-500 dark:text-white/30 text-xs mt-2">In progress</p>
          </div>
          
          <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🏆</span>
              <p className="text-slate-500 dark:text-white/40 text-xs uppercase tracking-widest">Achieved</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{achievedGoals}</p>
            <p className="text-slate-500 dark:text-white/30 text-xs mt-2">Goals completed 🎉</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="anim-3 flex gap-2 flex-wrap">
          {[
            { id: 'all', label: 'All Goals', icon: '📋' },
            { id: 'active', label: 'Active', icon: '🔥' },
            { id: 'urgent', label: 'Urgent', icon: '⚠️' },
            { id: 'achieved', label: 'Achieved', icon: '🏆' }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeFilter === filter.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {filter.icon} {filter.label}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-8 text-center">
            <p className="text-rose-400">{error}</p>
            <button onClick={fetchGoals} className="mt-4 px-4 py-2 bg-rose-500/20 rounded-xl text-rose-400 text-sm">Retry</button>
          </div>
        )}

        {/* Empty State */}
        {!error && filteredGoals.length === 0 && !loading && (
          <div className="anim-4 rounded-3xl bg-white dark:bg-gray-900/60 border border-slate-200 dark:border-white/[0.07] p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Goals Yet</h3>
            <p className="text-slate-500 dark:text-white/40 mb-6">
              Create your first savings goal and start your journey to financial freedom
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-medium"
            >
              Create Your First Goal
            </button>
          </div>
        )}

        {/* Goals Grid */}
        {!error && filteredGoals.length > 0 && !loading && (
          <div className="anim-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onAddProgress={() => {
                  setSelectedGoal(goal);
                  setShowProgressModal(true);
                }}
                onEdit={() => setEditingGoal(goal)}
                onDelete={() => setShowDeleteConfirm(goal.id)}
              />
            ))}
          </div>
        )}

        {/* Goal Insights */}
        {goals.length > 0 && <GoalInsights goals={goals} />}

        {/* Forms & Modals */}
        {showForm && (
          <GoalForm
            onSubmit={handleCreateGoal}
            onCancel={() => setShowForm(false)}
          />
        )}

        {editingGoal && (
          <GoalForm
            initialData={editingGoal}
            onSubmit={handleUpdateGoal}
            onCancel={() => setEditingGoal(null)}
          />
        )}

        {/* Confirm Delete Modal */}
        {showDeleteConfirm && (
          <ConfirmModal
            title="Delete Goal"
            message="Are you sure you want to delete this goal? This action cannot be undone."
            onConfirm={() => handleDeleteGoal(showDeleteConfirm)}
            onCancel={() => setShowDeleteConfirm(null)}
          />
        )}

        {/* Add Progress Modal */}
        {showProgressModal && selectedGoal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => {
            setShowProgressModal(false);
            setProgressAmount('');
            setSelectedGoal(null);
          }}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-white/[0.1]" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">💰</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Progress</h3>
                <p className="text-sm text-slate-500 dark:text-white/40 mt-1">{selectedGoal.name}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-widest mb-2">Amount to add</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/40">₹</span>
                  <input
                    type="number"
                    value={progressAmount}
                    onChange={(e) => setProgressAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2.5 text-lg font-semibold border border-slate-200 dark:border-white/[0.1] rounded-xl bg-white dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500"
                    autoFocus
                    min="1"
                    step="100"
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-white/40 mt-2">
                  <span>Current: {formatCurrency(selectedGoal.current_amount)}</span>
                  <span>Target: {formatCurrency(selectedGoal.target_amount)}</span>
                </div>
                <p className="text-xs text-emerald-400 mt-1">
                  Remaining: {formatCurrency(selectedGoal.target_amount - selectedGoal.current_amount)}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowProgressModal(false);
                    setProgressAmount('');
                    setSelectedGoal(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProgress}
                  disabled={!progressAmount || parseFloat(progressAmount) <= 0 || optimisticUpdate}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                >
                  {optimisticUpdate ? 'Adding...' : 'Add Progress'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Goals;