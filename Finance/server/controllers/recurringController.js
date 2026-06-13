const { supabaseAdmin } = require('../config/supabase');

const recurringController = {
  // Get all recurring transactions
  async getRecurring(req, res) {
    try {
      const userId = req.userId;

      const { data, error } = await supabaseAdmin
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('next_due_date', { ascending: true });

      if (error) throw error;

      res.json({
        success: true,
        recurring: data
      });
    } catch (error) {
      console.error('Get recurring error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Create a recurring transaction
  async createRecurring(req, res) {
    try {
      const { name, amount, type, category, frequency, next_due_date } = req.body;
      const userId = req.userId;

      const { data, error } = await supabaseAdmin
        .from('recurring_transactions')
        .insert([
          {
            user_id: userId,
            name,
            amount,
            type,
            category,
            frequency,
            next_due_date,
            is_active: true
          }
        ])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        recurring: data
      });
    } catch (error) {
      console.error('Create recurring error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update recurring transaction
  async updateRecurring(req, res) {
    try {
      const { id } = req.params;
      const { name, amount, type, category, frequency, is_active } = req.body;
      const userId = req.userId;

      const { data, error } = await supabaseAdmin
        .from('recurring_transactions')
        .update({
          name,
          amount,
          type,
          category,
          frequency,
          is_active,
          updated_at: new Date()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        recurring: data
      });
    } catch (error) {
      console.error('Update recurring error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete recurring transaction
  async deleteRecurring(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const { error } = await supabaseAdmin
        .from('recurring_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Recurring transaction deleted successfully'
      });
    } catch (error) {
      console.error('Delete recurring error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get upcoming bills (next 30 days)
  async getUpcomingBills(req, res) {
    try {
      const userId = req.userId;
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const { data, error } = await supabaseAdmin
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('type', 'expense')
        .gte('next_due_date', today.toISOString().split('T')[0])
        .lte('next_due_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('next_due_date', { ascending: true });

      if (error) throw error;

      // Calculate days until due
      const billsWithDays = data.map(bill => {
        const dueDate = new Date(bill.next_due_date);
        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return { ...bill, daysUntil };
      });

      res.json({
        success: true,
        upcomingBills: billsWithDays
      });
    } catch (error) {
      console.error('Get upcoming bills error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = recurringController;