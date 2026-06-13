const GoalInsights = ({ goals }) => {
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const achievedCount = goals.filter(g => g.isAchieved).length;
  const urgentCount = goals.filter(g => !g.isAchieved && g.daysLeft < 30).length;
  
  // Safe division - prevent division by zero
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const getMotivationalMessage = () => {
    if (achievedCount === goals.length && goals.length > 0) {
      return "🎉 Amazing! You've achieved all your goals! Time to set new ones!";
    }
    if (overallProgress > 75) {
      return "🚀 Almost there! You're in the final stretch. Keep pushing!";
    }
    if (overallProgress > 50) {
      return "🔥 You're over halfway there! Consistency is key!";
    }
    if (overallProgress > 25) {
      return "💪 Great start! Every contribution adds up. Keep going!";
    }
    if (urgentCount > 0) {
      return "⚠️ Some goals need attention. Focus on your urgent goals first!";
    }
    return "🌟 Every journey begins with a single step. Start saving today!";
  };

  const getTip = () => {
    if (urgentCount > 0) {
      return "Consider increasing your daily savings amount to catch up on urgent goals.";
    }
    if (totalSaved === 0 && goals.length > 0) {
      return "Start with small, consistent contributions. Even ₹100 a day adds up!";
    }
    if (overallProgress > 50) {
      return "You're doing great! Set up automatic transfers to stay consistent.";
    }
    return "Review your expenses to find extra money for your goals.";
  };

  return (
    <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800">
      <div className="flex items-start gap-3">
        <div className="text-2xl">💡</div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Motivation Corner</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{getMotivationalMessage()}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            <span className="text-green-600">💰 Total Saved: ₹{totalSaved.toLocaleString()}</span>
            <span className="text-blue-600">📊 Overall Progress: {Math.min(100, Math.floor(overallProgress))}%</span>
            <span className="text-purple-600">🏆 Achieved: {achievedCount}/{goals.length}</span>
          </div>
          <div className="mt-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Pro Tip: {getTip()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalInsights;