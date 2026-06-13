const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const supabase = require('./config/supabase');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({
  origin: true,          // reflects whatever origin made the request — perfect for local dev
  credentials: true,
}));
app.use(express.json());

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

// ==================== TRANSACTIONS ====================
app.get('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.userId)
      .order('date', { ascending: false });

    if (error) throw error;
    res.json({ success: true, transactions: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const { amount, type, category, date, note } = req.body;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || numAmount > 1000000) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ user_id: req.userId, amount: numAmount, type, category, date, note }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, transaction: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, category, date, note } = req.body;

    const { data, error } = await supabase
      .from('transactions')
      .update({ amount, type, category, date, note })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, transaction: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== BUDGETS ====================
app.get('/api/budgets', authMiddleware, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let query = supabase
      .from('budgets')
      .select('*')
      .eq('user_id', req.userId);

    const { data, error } = await query;

    if (error) throw error;

    // Calculate spent amounts for each budget
    const budgetsWithSpending = await Promise.all(
      data.map(async (budget) => {
        const startDate = `${budget.year}-${String(budget.month).padStart(2, '0')}-01`;
        const endDate = new Date(budget.year, budget.month, 0).toISOString().split('T')[0];
        
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', req.userId)
          .eq('type', 'expense')
          .eq('category', budget.category)
          .gte('date', startDate)
          .lte('date', endDate);

        const spent = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
        return { ...budget, spent, percentage: (spent / budget.amount) * 100 };
      })
    );

    res.json({ success: true, budgets: budgetsWithSpending });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/budgets', authMiddleware, async (req, res) => {
  try {
    const { category, amount, month, year } = req.body;

    const { data, error } = await supabase
      .from('budgets')
      .insert([{ user_id: req.userId, category, amount, month, year }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, budget: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/budgets/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ success: true, message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      const percentage = (goal.current_amount / goal.target_amount) * 100;
      const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
      return { ...goal, percentage: Math.min(percentage, 100), daysLeft: Math.max(0, daysLeft) };
    });

    res.json({ success: true, goals: goalsWithProgress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/goals', authMiddleware, async (req, res) => {
  try {
    const { name, target_amount, deadline } = req.body;

    const { data, error } = await supabase
      .from('goals')
      .insert([{ user_id: req.userId, name, target_amount, deadline, current_amount: 0 }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, goal: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/goals/:id/progress', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const { data: goal, error: getError } = await supabase
      .from('goals')
      .select('current_amount, target_amount')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (getError) throw getError;

    const newAmount = Math.min(goal.current_amount + amount, goal.target_amount);

    const { data, error } = await supabase
      .from('goals')
      .update({ current_amount: newAmount })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, goal: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/goals/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RECURRING TRANSACTIONS ====================
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
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/recurring/upcoming', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', req.userId)
      .eq('is_active', true)
      .eq('type', 'expense')
      .gte('next_due_date', today)
      .lte('next_due_date', thirtyDaysLater)
      .order('next_due_date', { ascending: true });

    if (error) throw error;

    const billsWithDays = data.map(bill => ({
      ...bill,
      daysUntil: Math.ceil((new Date(bill.next_due_date) - new Date()) / (1000 * 60 * 60 * 24))
    }));

    res.json({ success: true, upcomingBills: billsWithDays });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/recurring', authMiddleware, async (req, res) => {
  try {
    const { name, amount, type, category, frequency, next_due_date } = req.body;

    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert([{ user_id: req.userId, name, amount, type, category, frequency, next_due_date, is_active: true }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, recurring: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/recurring/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, type, category, frequency, is_active } = req.body;

    const { data, error } = await supabase
      .from('recurring_transactions')
      .update({ name, amount, type, category, frequency, is_active })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, recurring: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/recurring/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ success: true, message: 'Recurring transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TRANSACTIONS SUMMARY ====================
app.get('/api/transactions/summary', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((balance) / totalIncome) * 100 : 0;

    res.json({
      success: true,
      summary: {
        totalIncome,
        totalExpenses,
        balance,
        savingsRate: Math.round(savingsRate)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ==================== DASHBOARD SUMMARY ====================
app.get('/api/dashboard/summary', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((balance) / totalIncome) * 100 : 0;

    res.json({
      success: true,
      summary: {
        totalIncome,
        totalExpenses,
        balance,
        savingsRate: Math.round(savingsRate)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api/health`);
});

module.exports = app;