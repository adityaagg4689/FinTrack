import { useState, useEffect } from 'react';

const CATEGORIES = [
  { name: 'Food', icon: '🍔', color: 'from-orange-500 to-red-500' },
  { name: 'Transport', icon: '🚗', color: 'from-blue-500 to-cyan-500' },
  { name: 'Shopping', icon: '🛍️', color: 'from-pink-500 to-rose-500' },
  { name: 'Entertainment', icon: '🎬', color: 'from-purple-500 to-indigo-500' },
  { name: 'Housing', icon: '🏠', color: 'from-teal-500 to-emerald-500' },
  { name: 'Health', icon: '❤️', color: 'from-red-500 to-pink-500' },
  { name: 'Education', icon: '📚', color: 'from-yellow-500 to-amber-500' },
  { name: 'Utilities', icon: '💡', color: 'from-gray-500 to-gray-600' }
];

const BudgetForm = ({ onSubmit, onCancel, initialData = null, existingCategories = [], isEditing = false, currentMonth, currentYear }) => {
  const [formData, setFormData] = useState({
    category: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category,
        amount: initialData.amount
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.category) {
      setError('Please select a category');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }

    if (!isEditing && existingCategories.includes(formData.category)) {
      setError(`A budget for ${formData.category} already exists this month`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        category: formData.category,
        amount: parseFloat(formData.amount)
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = CATEGORIES.find(c => c.name === formData.category);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" 
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className={`h-1.5 bg-gradient-to-r ${selectedCategory?.color || 'from-blue-500 to-purple-500'}`}></div>
        
        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {isEditing ? 'Edit Budget' : 'Create New Budget'}
              </h2>
              {currentMonth && currentYear && (
                <p className="text-xs text-gray-500 mt-1">
                  For {currentMonth} {currentYear}
                </p>
              )}
            </div>
            <button 
              onClick={onCancel} 
              className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Category Selection */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
              Select Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.name })}
                  disabled={!isEditing && existingCategories.includes(cat.name)}
                  className={`p-2 rounded-xl border transition-all duration-200 ${
                    formData.category === cat.name
                      ? `border-blue-500 bg-gradient-to-r ${cat.color} text-white shadow-md`
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800'
                  } ${(!isEditing && existingCategories.includes(cat.name)) ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
              Monthly Budget Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400 font-bold">₹</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                className="w-full pl-8 pr-3 py-2.5 text-lg font-semibold border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">Set a realistic budget to track your spending</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 text-sm"
            >
              {loading ? 'Creating...' : (isEditing ? 'Update Budget' : 'Create Budget')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetForm;