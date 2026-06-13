import { useMemo } from 'react';

const BudgetCharts = ({ budgets, summary }) => {
  const chartData = useMemo(() => {
    const topCategories = [...budgets]
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);

    const worstCategories = [...budgets]
      .filter(b => b.status === 'overspent' || b.status === 'warning')
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    return { topCategories, worstCategories };
  }, [budgets]);

  if (budgets.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Top Spending Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🔥</span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Spending Categories</h3>
        </div>
        <div className="space-y-3">
          {chartData.topCategories.map((category, index) => (
            <div key={category.category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 dark:text-gray-300">
                  {index + 1}. {category.category}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ₹{category.spent.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(category.spent / summary.totalSpent) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Health */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📈</span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Budget Health</h3>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700 dark:text-gray-300">Overall Budget Usage</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {summary.overallPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  summary.overallPercentage >= 100 ? 'bg-red-500' :
                  summary.overallPercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(summary.overallPercentage, 100)}%` }}
              />
            </div>
          </div>

          {chartData.worstCategories.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">⚠️ Categories Needing Attention</p>
              <div className="space-y-2">
                {chartData.worstCategories.map(cat => (
                  <div key={cat.category} className="flex justify-between text-sm">
                    <span>{cat.category}</span>
                    <span className="text-red-600 dark:text-red-400">
                      {cat.percentage.toFixed(0)}% of budget
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        
        </div>
      </div>
    </div>
  );
};

export default BudgetCharts;