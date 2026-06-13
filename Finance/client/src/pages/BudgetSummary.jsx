const BudgetSummary = ({ summary, currentMonth }) => {
  const summaryCards = [
    {
      title: 'Total Budget',
      value: `₹${summary.totalBudget.toLocaleString()}`,
      icon: '💰',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Total Spent',
      value: `₹${summary.totalSpent.toLocaleString()}`,
      icon: '💸',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: 'Remaining',
      value: `₹${summary.totalRemaining.toLocaleString()}`,
      icon: '💚',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Overall Usage',
      value: `${summary.overallPercentage.toFixed(1)}%`,
      icon: '📊',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-2xl ${card.bgColor} p-6 transition-all duration-300 hover:scale-105 cursor-pointer group`}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                  {card.icon}
                </div>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${card.color} opacity-20 group-hover:opacity-40 transition-opacity`}></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            </div>
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-r ${card.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
          </div>
        ))}
      </div>

      {/* Category Status Summary */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-700 dark:text-green-400">
            {summary.onTrackCategories} On Track
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span className="text-sm text-yellow-700 dark:text-yellow-400">
            {summary.warningCategories} Near Limit
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-sm text-red-700 dark:text-red-400">
            {summary.overspentCategories} Overspent
          </span>
        </div>
      </div>
    </div>
  );
};

export default BudgetSummary;