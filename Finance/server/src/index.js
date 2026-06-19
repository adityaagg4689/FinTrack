const dotenv = require('dotenv');
const path   = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const { supabaseAdmin: supabase } = require('./config/supabase'); 
const authMiddleware              = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 5000;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

const allowedOrigins = [
  'http://localhost:5173',
  'https://fintrack-3-mfkr.onrender.com',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

const calculateMonthlySummary = async (userId) => {
  const now          = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();
  const startDate    = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  const endDate      = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('amount, type')       
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) throw error;

  const totalIncome   = transactions.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance       = totalIncome - totalExpenses;
  const savingsRate   = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  return { totalIncome, totalExpenses, balance, savingsRate: Math.round(savingsRate) };
};

const validateTransaction = (amount, type, category, date) => {
  const errors   = [];
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0 || numAmount > 1_000_000)
    errors.push('Amount must be a positive number up to 1,000,000');
  if (!type || !['income', 'expense'].includes(type))
    errors.push('Type must be "income" or "expense"');
  if (!category || !category.trim())
    errors.push('Category is required');
  if (!date || isNaN(new Date(date).getTime()))
    errors.push('A valid date is required');

  return { valid: errors.length === 0, errors };
};

// ✅ FIXED: validateBudget with proper number parsing
const validateBudget = (category, amount, month, year) => {
  const errors    = [];
  const numAmount = parseFloat(amount);
  const numMonth  = parseInt(month);
  const numYear   = parseInt(year);

  if (!category || !category.trim())
    errors.push('Category is required');
  if (isNaN(numAmount) || numAmount <= 0)
    errors.push('Amount must be a positive number');
  if (isNaN(numMonth) || numMonth < 1 || numMonth > 12)
    errors.push('Month must be between 1 and 12');
  if (isNaN(numYear) || numYear < 2000 || numYear > 2100)
    errors.push('Year must be between 2000 and 2100');

  return { valid: errors.length === 0, errors, numMonth, numYear };
};

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running', timestamp: new Date().toISOString() });
});

// ==================== TRANSACTIONS ====================

app.get('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.userId)
      .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate)   query = query.lte('date', endDate);
    if (type && ['income', 'expense'].includes(type)) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, transactions: data });
  } catch (error) {
    console.error('GET /api/transactions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/transactions/summary', authMiddleware, async (req, res) => {
  try {
    const summary = await calculateMonthlySummary(req.userId);
    res.json({ success: true, summary });
  } catch (error) {
    console.error('GET /api/transactions/summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const { amount, type, category, date, note } = req.body;

    const validation = validateTransaction(amount, type, category, date);
    if (!validation.valid)
      return res.status(400).json({ success: false, errors: validation.errors });

    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id:  req.userId,
        amount:   parseFloat(amount),
        type,
        category: category.trim(),
        date,
        note:     note ? note.trim() : null,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, transaction: data });
  } catch (error) {
    console.error('POST /api/transactions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const { id }                         = req.params;
    const { amount, type, category, date, note } = req.body;

    const validation = validateTransaction(amount, type, category, date);
    if (!validation.valid)
      return res.status(400).json({ success: false, errors: validation.errors });

    const { data, error } = await supabase
      .from('transactions')
      .update({
        amount:     parseFloat(amount),
        type,
        category:   category.trim(),
        date,
        note:       note ? note.trim() : null,
        updated_at: new Date(),
      })
      .eq('id', id)
      .eq('user_id', req.userId)   
      .select()
      .single();

    if (error) throw error;
    if (!data)  return res.status(404).json({ success: false, error: 'Transaction not found' });

    res.json({ success: true, transaction: data });
  } catch (error) {
    console.error('PUT /api/transactions/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ FIXED: Bulk Delete registered BEFORE :id route
app.delete('/api/transactions/bulk', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide an array of transaction IDs' 
      });
    }

    if (ids.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete more than 100 transactions at once'
      });
    }

    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .in('id', ids)
      .eq('user_id', req.userId)
      .select();

    if (error) throw error;

    res.json({ 
      success: true, 
      message: `Deleted ${data.length} transactions`,
      deletedCount: data.length
    });
  } catch (error) {
    console.error('DELETE /api/transactions/bulk:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    if (!data)  return res.status(404).json({ success: false, error: 'Transaction not found' });

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/transactions/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== BUDGETS ====================

app.get('/api/budgets', authMiddleware, async (req, res) => {
  try {
    const { month, year } = req.query;

    let query = supabase.from('budgets').select('*').eq('user_id', req.userId);
    if (month) query = query.eq('month', parseInt(month));
    if (year)  query = query.eq('year',  parseInt(year));

    const { data: budgets, error } = await query;
    if (error) throw error;

    if (budgets.length === 0) {
      return res.json({ success: true, budgets: [] });
    }

    const startDates = budgets.map(b => `${b.year}-${String(b.month).padStart(2, '0')}-01`);
    const endDates   = budgets.map(b => new Date(b.year, b.month, 0).toISOString().split('T')[0]);
    const minStart   = startDates.sort()[0];
    const maxEnd     = endDates.sort().reverse()[0];

    const { data: expenses, error: expError } = await supabase
      .from('transactions')
      .select('amount, category, date')
      .eq('user_id', req.userId)
      .eq('type', 'expense')
      .gte('date', minStart)
      .lte('date', maxEnd);

    if (expError) throw expError;

    const budgetsWithSpending = budgets.map(budget => {
      const startDate = `${budget.year}-${String(budget.month).padStart(2, '0')}-01`;
      const endDate   = new Date(budget.year, budget.month, 0).toISOString().split('T')[0];

      const spent = expenses
        .filter(t => t.category === budget.category && t.date >= startDate && t.date <= endDate)
        .reduce((sum, t) => sum + t.amount, 0);

      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        ...budget,
        spent,
        percentage:   Math.min(percentage, 100),
        isOverBudget: spent > budget.amount,
      };
    });

    res.json({ success: true, budgets: budgetsWithSpending });
  } catch (error) {
    console.error('GET /api/budgets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/budgets', authMiddleware, async (req, res) => {
  try {
    const { category, amount, month, year } = req.body;

    // ✅ FIXED: Use updated validateBudget that returns parsed numbers
    const validation = validateBudget(category, amount, month, year);
    if (!validation.valid)
      return res.status(400).json({ success: false, errors: validation.errors });

    const { data: existing, error: checkError } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id',  req.userId)
      .eq('category', category.trim())
      .eq('month',    validation.numMonth)
      .eq('year',     validation.numYear)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing)
      return res.status(400).json({ success: false, error: 'A budget for this category and month already exists' });

    const { data, error } = await supabase
      .from('budgets')
      .insert([{
        user_id:  req.userId,
        category: category.trim(),
        amount:   parseFloat(amount),
        month:    validation.numMonth,
        year:     validation.numYear,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, budget: data });
  } catch (error) {
    console.error('POST /api/budgets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/budgets/:id', authMiddleware, async (req, res) => {
  try {
    const { id }                         = req.params;
    const { category, amount, month, year } = req.body;

    // ✅ FIXED: Use updated validateBudget
    const validation = validateBudget(category, amount, month, year);
    if (!validation.valid)
      return res.status(400).json({ success: false, errors: validation.errors });

    const { data: duplicate, error: dupError } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id',  req.userId)
      .eq('category', category.trim())
      .eq('month',    validation.numMonth)
      .eq('year',     validation.numYear)
      .neq('id', id)
      .maybeSingle();

    if (dupError) throw dupError;
    if (duplicate)
      return res.status(400).json({ success: false, error: 'Another budget already exists for this category and month' });

    const { data, error } = await supabase
      .from('budgets')
      .update({
        category:   category.trim(),
        amount:     parseFloat(amount),
        month:      validation.numMonth,
        year:       validation.numYear,
        updated_at: new Date(),
      })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    if (!data)  return res.status(404).json({ success: false, error: 'Budget not found' });

    res.json({ success: true, budget: data });
  } catch (error) {
    console.error('PUT /api/budgets/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/budgets/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    if (!data)  return res.status(404).json({ success: false, error: 'Budget not found' });

    res.json({ success: true, message: 'Budget deleted' });
  } catch (error) {
    console.error('DELETE /api/budgets/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== GOALS ====================

app.get('/api/goals', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', req.userId)
      .order('deadline', { ascending: true });

    if (error) throw error;

    const goalsWithProgress = data.map(goal => {
      const percentage = goal.target_amount > 0
        ? (goal.current_amount / goal.target_amount) * 100
        : 0;
      const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
      return {
        ...goal,
        percentage:  Math.min(percentage, 100),
        daysLeft:    Math.max(0, daysLeft),
        isCompleted: percentage >= 100,
      };
    });

    res.json({ success: true, goals: goalsWithProgress });
  } catch (error) {
    console.error('GET /api/goals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/goals', authMiddleware, async (req, res) => {
  try {
    const { name, target_amount, deadline } = req.body;

    const errors = [];
    if (!name || !name.trim()) errors.push('Name is required');
    if (!target_amount || parseFloat(target_amount) <= 0) errors.push('Target amount must be positive');
    if (!deadline || isNaN(new Date(deadline).getTime())) errors.push('A valid deadline is required');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const { data, error } = await supabase
      .from('goals')
      .insert([{
        user_id: req.userId,
        name: name.trim(),
        target_amount: parseFloat(target_amount),
        deadline,
        current_amount: 0,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, goal: data });
  } catch (error) {
    console.error('POST /api/goals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/goals/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, target_amount, deadline } = req.body;

    const errors = [];
    if (!name || !name.trim()) errors.push('Name is required');
    if (!target_amount || parseFloat(target_amount) <= 0) errors.push('Target amount must be positive');
    if (!deadline || isNaN(new Date(deadline).getTime())) errors.push('A valid deadline is required');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const { data, error } = await supabase
      .from('goals')
      .update({
        name: name.trim(),
        target_amount: parseFloat(target_amount),
        deadline,
        // ✅ updated_at removed
      })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }

    res.json({ success: true, goal: data });
  } catch (error) {
    console.error('PUT /api/goals/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/goals/:id/progress', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be positive' });
    }

    const { data: goal, error: getError } = await supabase
      .from('goals')
      .select('current_amount, target_amount')
      .eq('id', id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (getError) throw getError;
    if (!goal) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }

    const newAmount = Math.min(goal.current_amount + parseFloat(amount), goal.target_amount);

    const { data, error } = await supabase
      .from('goals')
      .update({
        current_amount: newAmount,
        // ✅ updated_at removed
      })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, goal: data });
  } catch (error) {
    console.error('POST /api/goals/:id/progress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/goals/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }

    res.json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    console.error('DELETE /api/goals/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// ==================== RECURRING TRANSACTIONS ====================

app.get('/api/recurring/upcoming', authMiddleware, async (req, res) => {
  try {
    const today          = new Date().toISOString().split('T')[0];
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id',   req.userId)
      .eq('is_active', true)
      .eq('type',      'expense')
      .gte('next_due_date', today)
      .lte('next_due_date', thirtyDaysLater)
      .order('next_due_date', { ascending: true });

    if (error) throw error;

    const billsWithDays = data.map(bill => ({
      ...bill,
      daysUntil: Math.ceil((new Date(bill.next_due_date) - new Date()) / (1000 * 60 * 60 * 24)),
    }));

    res.json({ success: true, upcomingBills: billsWithDays });
  } catch (error) {
    console.error('GET /api/recurring/upcoming:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/recurring', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', req.userId)
      .order('next_due_date', { ascending: true });

    if (error) throw error;
    res.json({ success: true, recurring: data });
  } catch (error) {
    console.error('GET /api/recurring:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/recurring', authMiddleware, async (req, res) => {
  try {
    const { name, amount, type, category, frequency, next_due_date } = req.body;

    const errors = [];
    if (!name || !name.trim())                              errors.push('Name is required');
    if (!amount || parseFloat(amount) <= 0)                 errors.push('Amount must be positive');
    if (!type || !['income', 'expense'].includes(type))     errors.push('Type must be "income" or "expense"');
    if (!category || !category.trim())                      errors.push('Category is required');
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) errors.push('Invalid frequency');
    if (!next_due_date || isNaN(new Date(next_due_date).getTime()))    errors.push('A valid due date is required');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert([{
        user_id:       req.userId,
        name:          name.trim(),
        amount:        parseFloat(amount),
        type,
        category:      category.trim(),
        frequency,
        next_due_date,
        is_active:     true,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, recurring: data });
  } catch (error) {
    console.error('POST /api/recurring:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ FIXED: Removed updated_at
app.put('/api/recurring/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, type, category, frequency, next_due_date, is_active } = req.body;

    const errors = [];
    if (!name || !name.trim()) errors.push('Name is required');
    if (!amount || parseFloat(amount) <= 0) errors.push('Amount must be positive');
    if (!type || !['income', 'expense'].includes(type)) errors.push('Type must be "income" or "expense"');
    if (!category || !category.trim()) errors.push('Category is required');
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) errors.push('Invalid frequency');
    if (is_active !== undefined && typeof is_active !== 'boolean') errors.push('is_active must be a boolean');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const updateData = {
      name: name.trim(),
      amount: parseFloat(amount),
      type,
      category: category.trim(),
      frequency,
      // ✅ updated_at removed
    };

    if (next_due_date) {
      if (isNaN(new Date(next_due_date).getTime())) {
        return res.status(400).json({ success: false, error: 'A valid due date is required' });
      }
      updateData.next_due_date = next_due_date;
    }

    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    const { data, error } = await supabase
      .from('recurring_transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Recurring transaction not found' });
    }

    res.json({ success: true, recurring: data });
  } catch (error) {
    console.error('PUT /api/recurring/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/recurring/bulk', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide an array of recurring transaction IDs' 
      });
    }

    if (ids.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete more than 100 recurring transactions at once'
      });
    }

    const { data, error } = await supabase
      .from('recurring_transactions')
      .delete()
      .in('id', ids)
      .eq('user_id', req.userId)
      .select();

    if (error) throw error;

    res.json({ 
      success: true, 
      message: `Deleted ${data.length} recurring transactions`,
      deletedCount: data.length
    });
  } catch (error) {
    console.error('DELETE /api/recurring/bulk:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/recurring/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Recurring transaction not found' });
    }

    res.json({ success: true, message: 'Recurring transaction deleted' });
  } catch (error) {
    console.error('DELETE /api/recurring/:id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// ==================== DASHBOARD ====================

app.get('/api/dashboard/summary', authMiddleware, async (req, res) => {
  try {
    const summary = await calculateMonthlySummary(req.userId);
    res.json({ success: true, summary });
  } catch (error) {
    console.error('GET /api/dashboard/summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ERROR HANDLING ====================

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔒 Rate limit: 100 req / 15 min per IP`);
});

module.exports = app;
