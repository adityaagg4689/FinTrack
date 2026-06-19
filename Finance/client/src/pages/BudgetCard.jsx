import { useState } from 'react';

// BudgetCard.jsx - Add the same guard
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  return `₹${Math.abs(amount).toLocaleString('en-IN')}`;
};
const BudgetCard = ({ budget, onEdit, onDelete }) => {
  // ✅ Ensure all values are numbers
  const amount = Number(budget.amount) || 0;
  const spent = Number(budget.spent) || 0;
  const percentage = Number(budget.percentage) || 0;
  
  // ✅ Now calculations work correctly
  const remaining = Math.max(0, amount - spent);
  const overspent = Math.max(0, spent - amount);
  const isOverBudget = spent > amount;

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '₹0';
    }
    return `₹${Math.abs(value).toLocaleString('en-IN')}`;
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-white/[0.07] p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{budget.category}</h3>
          <p className="text-xs text-slate-500 dark:text-white/40 uppercase tracking-wider">Monthly Budget</p>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1 text-slate-400 hover:text-blue-400 transition-colors">✏️</button>
          <button onClick={onDelete} className="p-1 text-slate-400 hover:text-rose-400 transition-colors">🗑️</button>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between items-end">
          <div>
            <p className={`text-2xl font-bold ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formatCurrency(spent)}
            </p>
            <p className="text-xs text-slate-500 dark:text-white/40">of {formatCurrency(amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {percentage.toFixed(0)}%
            </p>
            <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  percentage >= 100 ? 'bg-rose-500' : 
                  percentage >= 80 ? 'bg-amber-500' : 
                  'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
          <div>
            <p className="text-[10px] text-slate-500 dark:text-white/30 uppercase tracking-wider">Remaining</p>
            <p className={`text-sm font-semibold ${remaining > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {formatCurrency(remaining)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 dark:text-white/30 uppercase tracking-wider">Overspent</p>
            <p className={`text-sm font-semibold ${overspent > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {formatCurrency(overspent)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetCard;
