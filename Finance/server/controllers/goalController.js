const { supabaseAdmin } = require('../config/supabase');
const { validateGoal } = require('../utils/validation');

const goalController = {
  // Get all goals for a user
  async getGoals(req, res) {
    try {
      const userId = req.userId;

      const { data, error } = await supabaseAdmin
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('deadline', { ascending: true });

      if (error) throw error;

      // Calculate progress and days remaining
      const goalsWithProgress = data.map(goal => {
        const percentage = (goal.current_amount / goal.target_amount) * 100;
        const today = new Date();
        const deadline = new Date(goal.deadline);
        const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        const dailyNeeded = daysLeft > 0 ? (goal.target_amount - goal.current_amount) / daysLeft : 0;

        return {
          ...goal,
          percentage: Math.min(percentage, 100),
          daysLeft: Math.max(0, daysLeft),
          dailyNeeded: Math.max(0, dailyNeeded),
          isAchieved: goal.current_amount >= goal.target_amount
        };
      });

      res.json({
        success: true,
        goals: goalsWithProgress
      });
    } catch (error) {
      console.error('Get goals error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Create a new goal
  async createGoal(req, res) {
    try {
      const { name, target_amount, deadline } = req.body;
      const userId = req.userId;

      const validation = validateGoal({ name, targetAmount: target_amount, deadline });
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.errors.join(', ') });
      }

      const { data, error } = await supabaseAdmin
        .from('goals')
        .insert([
          {
            user_id: userId,
            name,
            target_amount,
            current_amount: 0,
            deadline
          }
        ])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        goal: data
      });
    } catch (error) {
      console.error('Create goal error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update goal progress
  async updateGoalProgress(req, res) {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      const userId = req.userId;

      // Get current goal
      const { data: goal, error: getError } = await supabaseAdmin
        .from('goals')
        .select('current_amount, target_amount')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (getError || !goal) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      const newAmount = Math.min(goal.current_amount + amount, goal.target_amount);

      const { data, error } = await supabaseAdmin
        .from('goals')
        .update({ 
          current_amount: newAmount,
          updated_at: new Date()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        goal: data
      });
    } catch (error) {
      console.error('Update goal progress error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete a goal
  async deleteGoal(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const { error } = await supabaseAdmin
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Goal deleted successfully'
      });
    } catch (error) {
      console.error('Delete goal error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = goalController;