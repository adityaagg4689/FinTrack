import { useState, useEffect } from 'react';

// Helper: Get local date string without timezone issues
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const RecurringForm = ({ onSubmit, onCancel, initialData = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    amount: initialData?.amount || '',
    type: initialData?.type || 'expense',
    category: initialData?.category || '',
    frequency: initialData?.frequency || 'monthly',
    next_due_date: initialData?.next_due_date || getLocalDateString(new Date())
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');

  const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Rental Income', 'Other Income'],
    expense: ['Rent', 'Utilities', 'Internet', 'Phone', 'Subscription', 'Insurance', 'Loan', 'Other Expense']
  };

  // Reset category when type changes (to avoid stale category)
  const handleTypeChange = (newType) => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      category: '' // Reset category on type change
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNameError('');

    if (!formData.name.trim()) {
      setError('Please enter a name');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!formData.category) {
      setError('Please select a category');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      if (err.message.includes('already exists')) {
        setNameError(err.message);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isValidName = formData.name.trim().length > 0;
  const isNameDuplicateDetected = nameError && !isEditing;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-white/[0.1]">
        <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
        
        <div className="p-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {initialData ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-white/40 mt-1">
                {initialData ? 'Update amount, frequency, or other details' : 'Set it once, automate forever'}
              </p>
            </div>
            <button 
              onClick={onCancel} 
              className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setNameError('');
                }}
                placeholder="e.g., Netflix, Salary, Rent"
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 ${
                  isNameDuplicateDetected ? 'border-red-500' : 'border-slate-200 dark:border-white/[0.1]'
                }`}
                autoFocus
              />
              {isNameDuplicateDetected && (
                <p className="text-xs text-red-500 mt-1">{nameError}</p>
              )}
            </div>

            {/* Type Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  disabled={isEditing}
                  className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                    formData.type === 'expense'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10'
                  } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  💸 Expense
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  disabled={isEditing}
                  className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                    formData.type === 'income'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10'
                  } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  💰 Income
                </button>
              </div>
              {isEditing && (
                <p className="text-xs text-slate-500 dark:text-white/40 mt-1">Type cannot be changed after creation</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/40">₹</span>
                <input
                  type="number"
                  step="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-white/[0.1] rounded-xl bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {initialData && (
                <p className="text-xs text-blue-500 mt-1">
                  💡 Update amount here if subscription price changed
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-white/[0.1] rounded-xl bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="" className="text-slate-500">Select category</option>
                {categories[formData.type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Frequency
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, frequency: 'weekly' })}
                  className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                    formData.frequency === 'weekly'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  📅 Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, frequency: 'monthly' })}
                  className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                    formData.frequency === 'monthly'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  📆 Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, frequency: 'yearly' })}
                  className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
                    formData.frequency === 'yearly'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  📅 Yearly
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 mt-1">
                Weekly = 52 payments/year | Monthly = 12 payments/year | Yearly = 1 payment/year
              </p>
            </div>

            {/* Next Due Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Next Due Date
              </label>
              <input
                type="date"
                value={formData.next_due_date}
                onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                min={getLocalDateString(new Date())}
                className="w-full px-3 py-2 border border-slate-200 dark:border-white/[0.1] rounded-xl bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-slate-500 dark:text-white/40 mt-1">First date when this transaction will occur</p>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={onCancel} 
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading || !isValidName} 
                className="flex-1 px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (initialData ? 'Update Changes' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecurringForm;