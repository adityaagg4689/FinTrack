const { supabaseAdmin } = require('../config/supabase');
const { validateTransaction } = require('../utils/validation');

const transactionController = {
  // Get all transactions for a user
  
  async getTransactions(req, res) {
    try {
      const { startDate, endDate, type, category } = req.query;
      const userId = req.userId;

      let query = supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }
      if (type) {
        query = query.eq('type', type);
      }
      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        transactions: data
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Create a new transaction
  async createTransaction(req, res) {
    try {
      const { amount, type, category, date, note } = req.body;
      const userId = req.userId;

      const validation = validateTransaction({ amount, type, category, date });
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.errors.join(', ') });
      }

      const { data, error } = await supabaseAdmin
        .from('transactions')
        .insert([
          {
            user_id: userId,
            amount,
            type,
            category,
            date,
            note: note || null
          }
        ])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        transaction: data
      });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update a transaction
  async updateTransaction(req, res) {
    try {
      const { id } = req.params;
      const { amount, type, category, date, note } = req.body;
      const userId = req.userId;

      // Verify ownership
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('transactions')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (checkError || !existing) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const { data, error } = await supabaseAdmin
        .from('transactions')
        .update({
          amount,
          type,
          category,
          date,
          note: note || null,
          updated_at: new Date()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        transaction: data
      });
    } catch (error) {
      console.error('Update transaction error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete a transaction
  async deleteTransaction(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      // Verify ownership
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('transactions')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (checkError || !existing) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const { error } = await supabaseAdmin
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      console.error('Delete transaction error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get transaction summary for dashboard
  async getSummary(req, res) {
    try {
      const userId = req.userId;
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Get all transactions for current month
const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

const { data: transactions } = await supabaseAdmin
  .from('transactions')
  .select('*')
  .eq('user_id', userId)
  .gte('date', startOfMonth)
  .lte('date', endOfMonth);
      if (error) throw error;

      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

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
      console.error('Get summary error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = transactionController;