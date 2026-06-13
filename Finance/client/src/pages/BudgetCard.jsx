import { useState } from 'react';

const formatCurrency = (amount) => `₹${Math.abs(amount).toLocaleString('en-IN')}`;

const BudgetCard = ({ budget, onEdit, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusGradient = () => {
    switch (budget.status) {
      case 'overspent': return 'from-rose-500 to-rose-600';
      case 'warning': return 'from-amber-500 to-amber-600';
      default: return 'from-emerald-500 to-emerald-600';
    }
  };

  const getProgressColor = () => {
    if (budget.percentage >= 100) return 'bg-rose-500';
    if (budget.percentage >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStatusBadge = () => {
    switch (budget.status) {
      case 'good':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: '✅', label: 'On Track' };
      case 'warning':
        return { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: '⚠️', label: 'Near Limit' };
      default:
        return { bg: 'bg-rose-500/20', text: 'text-rose-400', icon: '🚨', label: 'Overspent' };
    }
  };

  const getEmoji = () => {
    const emojis = {
      'Food': '🍔', 'Transport': '🚗', 'Shopping': '🛍️', 'Entertainment': '🎬',
      'Housing': '🏠', 'Health': '❤️', 'Education': '📚', 'Utilities': '💡',
      'Rent': '🏠', 'Salary': '💼', 'Freelance': '🧑‍💻', 'Investment': '📈'
    };
    return emojis[budget.category] || '💰';
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="group relative rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 overflow-hidden">
      {/* Gradient Header */}
      <div className={`h-1 bg-gradient-to-r ${getStatusGradient()}`} />
      
      {/* Card Content */}
      <div className="p-5">
        {/* Category Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl">
              {getEmoji()}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {budget.category}
              </h3>
              <p className="text-xs text-slate-500 dark:text-white/40 uppercase tracking-wide">
                Monthly Budget
              </p>
            </div>
          </div>
          
          {/* Actions Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4 text-slate-500 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showDetails && (
              <div className="absolute right-0 mt-2 w-28 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/[0.07] z-10 overflow-hidden animate-fade-in">
                <button
                  onClick={() => { onEdit(); setShowDetails(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  ✏️ Edit Budget
                </button>
                <button
                  onClick={() => { onDelete(); setShowDetails(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Amount Display */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(budget.spent)}
            </span>
            <span className="text-xs text-slate-500 dark:text-white/40">
              of {formatCurrency(budget.amount)}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className={`${getProgressColor()} h-2 transition-all duration-500 ease-out rounded-full`}
              style={{ width: `${Math.min(budget.percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 dark:text-white/40">Remaining</span>
            <span className={`text-sm font-semibold ${budget.remaining > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(budget.remaining)}
            </span>
          </div>
          {budget.overspent > 0 && (
            <div className="flex justify-between items-center animate-pulse">
              <span className="text-xs text-rose-400">Overspent</span>
              <span className="text-sm font-semibold text-rose-400">
                +{formatCurrency(budget.overspent)}
              </span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/10">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
            <span>{statusBadge.icon}</span>
            <span>{statusBadge.label}</span>
            <span className="ml-1 text-[10px] opacity-70">{budget.percentage.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetCard;