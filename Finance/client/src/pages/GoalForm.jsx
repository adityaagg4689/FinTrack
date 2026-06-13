
import { useState } from 'react';

const goalSuggestions = [
  { name: 'Emergency Fund', icon: '🚨', min: 50000, desc: '3-6 months of expenses' },
  { name: 'Vacation', icon: '🏖️', min: 25000, desc: 'Trip to your dream destination' },
  { name: 'New Car', icon: '🚗', min: 300000, desc: 'Your dream car' },
  { name: 'Home Down Payment', icon: '🏠', min: 500000, desc: 'First step to home ownership' },
  { name: 'Wedding Fund', icon: '💍', min: 200000, desc: 'Special day savings' },
  { name: 'Education', icon: '📚', min: 100000, desc: 'Invest in your future' },
  { name: 'Retirement', icon: '👴', min: 1000000, desc: 'Secure your golden years' },
  { name: 'Business Startup', icon: '💼', min: 200000, desc: 'Be your own boss' }
];

const GoalForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    target_amount: initialData?.target_amount || '',
    deadline: initialData?.deadline || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter a goal name');
      return;
    }

    if (!formData.target_amount || parseFloat(formData.target_amount) <= 0) {
      setError('Please enter a valid target amount');
      return;
    }

    if (!formData.deadline) {
      setError('Please select a deadline');
      return;
    }

    const deadlineDate = new Date(formData.deadline);
    if (deadlineDate <= new Date()) {
      setError('Deadline must be in the future');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        deadline: formData.deadline
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion) => {
    setFormData({
      ...formData,
      name: suggestion.name,
      target_amount: suggestion.min
    });
  };

  const displayedSuggestions = showAllSuggestions ? goalSuggestions : goalSuggestions.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-500"></div>
        
        <div className="p-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {initialData ? 'Edit Savings Goal' : 'Create Savings Goal'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">Dream it, plan it, achieve it</p>
            </div>
            <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Goal Suggestions - Show more toggle */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
              Popular Goals
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {displayedSuggestions.map((suggestion) => (
                <button
                  key={suggestion.name}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  title={suggestion.desc}
                >
                  {suggestion.icon} {suggestion.name}
                </button>
              ))}
            </div>
            {goalSuggestions.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                className="text-xs text-green-600 hover:text-green-700"
              >
                {showAllSuggestions ? 'Show less ↑' : `Show ${goalSuggestions.length - 4} more ↓`}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Goal Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
                Goal Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Emergency Fund, Dream Vacation"
                className="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
            </div>

            {/* Target Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
                Target Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input
                  type="number"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
                Target Date
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Set a realistic deadline for your goal</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs">
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
                type="submit"
                disabled={loading}
                className="flex-1 px-3 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 text-sm"
              >
                {loading ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Goal' : 'Create Goal')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GoalForm;