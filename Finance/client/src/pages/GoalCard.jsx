import { useState } from 'react';

// Static class mapping for Tailwind purge safety
const STATUS_CONFIG = {
  achieved: {
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-400',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    gradientClass: 'from-green-500 to-emerald-500',
    icon: '🏆',
    label: 'Achieved!'
  },
  overdue: {
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    gradientClass: 'from-red-500 to-rose-500',
    icon: '⚠️',
    label: 'Overdue'
  },
  urgent: {
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    textClass: 'text-yellow-700 dark:text-yellow-400',
    badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    gradientClass: 'from-yellow-500 to-orange-500',
    icon: '🔥',
    label: 'Urgent'
  },
  active: {
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-400',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    gradientClass: 'from-blue-500 to-cyan-500',
    icon: '📈',
    label: 'In Progress'
  }
};

// Goal icon mapping (store in DB in future)
const getGoalIcon = (name) => {
  const iconMap = {
    'Emergency': '🚨',
    'Vacation': '🏖️',
    'House': '🏠',
    'Car': '🚗',
    'Wedding': '💍',
    'Education': '📚',
    'Retirement': '👴',
    'Business': '💼'
  };
  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key)) return icon;
  }
  return '🎯';
};

const GoalCard = ({ goal, onAddProgress, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const statusConfig = STATUS_CONFIG[goal.isAchieved ? 'achieved' : goal.isOverdue ? 'overdue' : goal.daysLeft < 30 ? 'urgent' : 'active'];

  // Calculate time progress safely
  const startDate = new Date(goal.created_at);
  const deadline = new Date(goal.deadline);
  const totalDuration = deadline - startDate;
  const elapsed = Math.min(totalDuration, Math.max(0, new Date() - startDate));
  const timeProgress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Gradient Header */}
      <div className={`h-2 bg-gradient-to-r ${statusConfig.gradientClass}`}></div>
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{getGoalIcon(goal.name)}</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {goal.name}
              </h3>
            </div>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.badgeClass}`}>
              <span>{statusConfig.icon}</span>
              <span>{statusConfig.label}</span>
            </div>
          </div>
          
          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
                <button
                  onClick={() => { onEdit(); setShowMenu(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => { onDelete(); setShowMenu(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Amount Display */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-semibold">
              ₹{goal.current_amount.toLocaleString()} / ₹{goal.target_amount.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`bg-gradient-to-r ${statusConfig.gradientClass} h-3 transition-all duration-500 rounded-full`}
              style={{ width: `${goal.percentage}%` }}
            />
          </div>
          <p className="text-xs text-right mt-1 text-gray-500">{goal.percentage.toFixed(1)}% complete</p>
        </div>

        {/* Time Info */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">📅 Deadline</span>
            <span className="font-medium">{new Date(goal.deadline).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">⏰ Days Left</span>
            <span className={`font-medium ${goal.daysLeft < 30 && !goal.isAchieved ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
              {goal.isAchieved ? 'Completed!' : goal.daysLeft === 0 ? 'Today!' : `${goal.daysLeft} days`}
            </span>
          </div>
          {!goal.isAchieved && goal.daysLeft > 0 && (
            <>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Time Progress</span>
                  <span>{Math.min(100, Math.floor(timeProgress))}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, timeProgress)}%` }}
                  />
                </div>
              </div>
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">💡 Need per day</span>
                  <span className="font-semibold text-blue-600">₹{Math.ceil(goal.dailyNeeded).toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {!goal.isAchieved && (
          <button
            onClick={onAddProgress}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg transition-all transform hover:scale-105"
          >
            + Add Progress
          </button>
        )}

        {goal.isAchieved && (
          <div className="text-center py-2 text-green-600 dark:text-green-400 font-semibold">
            🎉 Goal Achieved! 🎉
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalCard;