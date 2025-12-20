--  Database Schema
-- Advanced Personal Finance Tracker

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  color VARCHAR(7) DEFAULT '#FF6B00',
  icon VARCHAR(50) DEFAULT '💰',
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  payment_method VARCHAR(20) DEFAULT 'cash',
  notes TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goals table for financial objectives
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  target_amount NUMERIC(12,2) NOT NULL,
  current_amount NUMERIC(12,2) DEFAULT 0,
  target_date DATE,
  category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budgets table for monthly limits
CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  monthly_limit NUMERIC(12,2) NOT NULL,
  spent_amount NUMERIC(12,2) DEFAULT 0,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, month, year, user_id)
);

-- Insert default categories
INSERT INTO categories (name, type, color, icon, user_id) VALUES
('Salary', 'income', '#00FF88', '💰', NULL),
('Freelance', 'income', '#00DD77', '💻', NULL),
('Investment', 'income', '#00BB66', '📈', NULL),
('Gift', 'income', '#009955', '🎁', NULL),
('Food & Groceries', 'expense', '#FF6B00', '🍕', NULL),
('Transport', 'expense', '#FF8C00', '🚗', NULL),
('Housing & Utilities', 'expense', '#FF4500', '🏠', NULL),
('Entertainment', 'expense', '#FF2D00', '🎬', NULL),
('Health', 'expense', '#E6001A', '🏥', NULL),
('Shopping', 'expense', '#CC0015', '🛍️', NULL),
('Education', 'expense', '#B30012', '📚', NULL),
('Technology', 'expense', '#99000F', '💻', NULL)
ON CONFLICT DO NOTHING;

-- Insert sample data for demo
INSERT INTO transactions (type, description, amount, date, category, payment_method, notes, user_id) VALUES

ON CONFLICT DO NOTHING;

-- Insert sample goals
INSERT INTO goals (title, description, target_amount, current_amount, target_date, category, user_id) VALUES

ON CONFLICT DO NOTHING;

-- Insert sample budgets for current month
INSERT INTO budgets (category, monthly_limit, spent_amount, month, year, user_id) VALUES

ON CONFLICT DO NOTHING;