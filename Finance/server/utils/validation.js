const validateTransaction = (data) => {
  const errors = [];

  if (!data.amount || data.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!data.type || !['income', 'expense'].includes(data.type)) {
    errors.push('Type must be income or expense');
  }

  if (!data.category) {
    errors.push('Category is required');
  }

  if (!data.date) {
    errors.push('Date is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateBudget = (data) => {
  const errors = [];

  if (!data.category) {
    errors.push('Category is required');
  }

  if (!data.amount || data.amount <= 0) {
    errors.push('Budget amount must be greater than 0');
  }

  if (!data.month || data.month < 1 || data.month > 12) {
    errors.push('Month must be between 1 and 12');
  }

  if (!data.year || data.year < 2020 || data.year > 2030) {
    errors.push('Year must be between 2020 and 2030');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateGoal = (data) => {
  const errors = [];

  if (!data.name) {
    errors.push('Goal name is required');
  }

  if (!data.targetAmount || data.targetAmount <= 0) {
    errors.push('Target amount must be greater than 0');
  }

  if (!data.deadline) {
    errors.push('Deadline is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateTransaction,
  validateBudget,
  validateGoal
};