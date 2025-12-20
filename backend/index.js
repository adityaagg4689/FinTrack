const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for development
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000', 
    'http://frontend:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'https://fintrack-1-g7rr.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'}`);
  next();
});

const pool = new Pool({
  user: process.env.DB_USER || 'DfinanceUser',
  host: process.env.DB_HOST || 'db',
  database: process.env.DB_NAME || 'DfinanceDB',
  password: process.env.DB_PASSWORD || 'DfinancePassword',
  port: process.env.DB_PORT || 5432,
  // Add these to fix IPv6 issues
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err);
    console.error('Connection config:', {
      host: process.env.DB_HOST || 'db',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'DfinanceDB',
      user: process.env.DB_USER || 'DfinanceUser'
    });
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// TRANSACTIONS ROUTES

// Get all transactions
app.get('/transactions', async (req, res) => {
  try {
    let { limit = 100, offset = 0, type, category, startDate, endDate } = req.query;
    // Ensure numeric values for pagination to prevent SQL errors
    limit = parseInt(limit, 10);
    offset = parseInt(offset, 10);

    if (isNaN(limit) || limit <= 0) limit = 100;
    if (isNaN(offset) || offset < 0) offset = 0;

    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(type);
    }

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (startDate) {
      paramCount++;
      query += ` AND date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND date <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY date DESC, created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create transaction
app.post('/transactions', async (req, res) => {
  try {
    const { type, description, amount, date, category, payment_method = 'cash', notes = '' } = req.body;

    // Validate required fields explicitly to allow zero amounts
    if (!type || !description || amount === undefined || amount === null || !date || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO transactions (type, description, amount, date, category, payment_method, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [type, description, parseFloat(amount), date, category, payment_method, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update transaction
app.put('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description, amount, date, category, payment_method, notes } = req.body;
    
    const result = await pool.query(
      `UPDATE transactions 
       SET type = $1, description = $2, amount = $3, date = $4, category = $5, 
           payment_method = $6, notes = $7, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $8 RETURNING *`,
      [type, description, parseFloat(amount), date, category, payment_method, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete transaction
app.delete('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// ANALYTICS ROUTES

// Get financial summary
app.get('/analytics/summary', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    let dateFilter = '';
    
    switch (period) {
      case 'week':
        dateFilter = "AND date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND date >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND date >= CURRENT_DATE - INTERVAL '365 days'";
        break;
    }

    const summaryQuery = `
      SELECT 
        type,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM transactions 
      WHERE 1=1 ${dateFilter}
      GROUP BY type
    `;

    const categoryQuery = `
      SELECT 
        category,
        type,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE 1=1 ${dateFilter}
      GROUP BY category, type 
      ORDER BY total_amount DESC
    `;

    const [summaryResult, categoryResult] = await Promise.all([
      pool.query(summaryQuery),
      pool.query(categoryQuery)
    ]);

    res.json({
      summary: summaryResult.rows,
      categories: categoryResult.rows,
      period
    });
  } catch (err) {
    console.error('Error fetching analytics summary:', err);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

// Get monthly trends
app.get('/analytics/trends', async (req, res) => {
  try {
    const months = parseInt(req.query.months ?? 12, 10);

    if (Number.isNaN(months)) {
      return res.status(400).json({ error: 'Invalid months parameter' });
    }

    const query = `
      SELECT DATE_TRUNC('month', date) as month, type,
             SUM(amount) as total_amount, COUNT(*) as transaction_count
      FROM transactions
      WHERE date >= CURRENT_DATE - INTERVAL $1
      GROUP BY DATE_TRUNC('month', date), type
      ORDER BY month DESC, type`;
    const result = await pool.query(query, [`${months} months`]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching trends:', err);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// GOALS ROUTES

// Get all goals
app.get('/goals', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM goals ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching goals:', err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Create goal
app.post('/goals', async (req, res) => {
  try {
    const { title, description, target_amount, target_date, category } = req.body;
    
    const result = await pool.query(
      `INSERT INTO goals (title, description, target_amount, target_date, category) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, parseFloat(target_amount), target_date, category]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating goal:', err);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update goal progress
app.put('/goals/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    
    const result = await pool.query(
      'UPDATE goals SET current_amount = current_amount + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [parseFloat(amount), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Check if goal is completed
    const goal = result.rows[0];
    if (goal.current_amount >= goal.target_amount && goal.status !== 'completed') {
      await pool.query(
        "UPDATE goals SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [id]
      );
      goal.status = 'completed';
    }

    res.json(goal);
  } catch (err) {
    console.error('Error updating goal progress:', err);
    res.status(500).json({ error: 'Failed to update goal progress' });
  }
});

// Update goal (edit goal details)
app.put('/goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, target_amount, target_date, current_amount } = req.body;
    
    const result = await pool.query(
      `UPDATE goals SET 
        title = $1, 
        target_amount = $2, 
        target_date = $3, 
        current_amount = $4,
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 RETURNING *`,
      [title, parseFloat(target_amount), target_date, parseFloat(current_amount || 0), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Check if goal is completed after update
    const goal = result.rows[0];
    if (goal.current_amount >= goal.target_amount && goal.status !== 'completed') {
      await pool.query(
        "UPDATE goals SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [id]
      );
      goal.status = 'completed';
    } else if (goal.current_amount < goal.target_amount && goal.status === 'completed') {
      await pool.query(
        "UPDATE goals SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [id]
      );
      goal.status = 'active';
    }

    res.json(goal);
  } catch (err) {
    console.error('Error updating goal:', err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Delete goal
app.delete('/goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM goals WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting goal:', err);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// BUDGETS ROUTES

// Get current month budgets
app.get('/budgets', async (req, res) => {
  try {
    const now = new Date();
    const month = req.query.month || now.getMonth() + 1;
    const year = req.query.year || now.getFullYear();

    const result = await pool.query(
      'SELECT * FROM budgets WHERE month = $1 AND year = $2 ORDER BY category',
      [month, year]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching budgets:', err);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// Create or update budget
app.post('/budgets', async (req, res) => {
  try {
    const { category, monthly_limit, month, year } = req.body;
    
    const result = await pool.query(
      `INSERT INTO budgets (category, monthly_limit, month, year) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (category, month, year, user_id) 
       DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit, spent_amount = budgets.spent_amount
       RETURNING *`,
      [category, parseFloat(monthly_limit), month, year]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating/updating budget:', err);
    res.status(500).json({ error: 'Failed to create/update budget' });
  }
});

// CATEGORIES ROUTES

// Get categories
app.get('/categories', async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM categories WHERE user_id IS NULL';
    const params = [];

    if (type) {
      query += ' AND type = $1';
      params.push(type);
    }

    query += ' ORDER BY name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FinTrack API server running on port ${PORT}`);
    console.log(`🏁 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
