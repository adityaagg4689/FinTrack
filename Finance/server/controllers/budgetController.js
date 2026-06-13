const { supabaseAdmin } = require('../config/supabase');
const { validateBudget } = require('../utils/validation');

const budgetController = {
  // Get all budgets for a user
  async getBudgets(req, res) {
    try {
      const { month, year } = req.query;
      const userId = req.userId;

      let query = supabaseAdmin
        .from('budgets')
        .select('*')
        .eq('user_id', userId);

      if (month) query = query.eq('month', month);
      if (year) query = query.eq('year', year);

      const { data, error } = await query;

      if (error) throw error;

      // Get actual spending for each budget category
      const budgetsWithSpending = await Promise.all(
        data.map(async (budget) => {
          const { data: transactions, error: tError } = await supabaseAdmin
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('type', 'expense')
            .eq('category', budget.category)
            .eq('extract(month from date)', budget.month)
            .eq('extract(year from date)', budget.year);

          if (tError) throw tError;

          const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
          const percentage = (spent / budget.amount) * 100;

          return {
            ...budget,
            spent,
            percentage: Math.min(percentage, 100),
            isOverBudget: spent > budget.amount
          };
        })
      );

      res.json({
        success: true,
        budgets: budgetsWithSpending
      });
    } catch (error) {
      console.error('Get budgets error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Create a new budget
  async createBudget(req, res) {
    try {
      const { category, amount, month, year } = req.body;
      const userId = req.userId;

      const validation = validateBudget({ category, amount, month, year });
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.errors.join(', ') });
      }

      // Check if budget already exists for this category/month/year
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('budgets')
        .select('id')
        .eq('user_id', userId)
        .eq('category', category)
        .eq('month', month)
        .eq('year', year)
        .single();

      if (existing) {
        return res.status(400).json({ error: 'Budget already exists for this category and month' });
      }

      const { data, error } = await supabaseAdmin
        .from('budgets')
        .insert([
          {
            user_id: userId,
            category,
            amount,
            month,
            year
          }
        ])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        budget: data
      });
    } catch (error) {
      console.error('Create budget error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update a budget
  async updateBudget(req, res) {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      const userId = req.userId;

      const { data, error } = await supabaseAdmin
        .from('budgets')
        .update({ amount, updated_at: new Date() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        budget: data
      });
    } catch (error) {
      console.error('Update budget error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete a budget
  async deleteBudget(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const { error } = await supabaseAdmin
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Budget deleted successfully'
      });
    } catch (error) {
      console.error('Delete budget error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = budgetController;