import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://your-project.supabase.co', 'your-service-role-key');

async function runMigration() {
  const sql = `
    -- Enable UUID generation
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- Create 'users' table
    CREATE TABLE IF NOT EXISTS users (
      user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      age INTEGER,
      email TEXT UNIQUE NOT NULL,
      interests JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      clerk_id TEXT UNIQUE NOT NULL
    );

    -- Create 'wallets' table
    CREATE TABLE IF NOT EXISTS wallets (
      wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
      credit_balance NUMERIC(12, 2) DEFAULT 0.00,
      debit_balance NUMERIC(12, 2) DEFAULT 0.00,
      payment_methods JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Create 'transactions' table
    CREATE TABLE IF NOT EXISTS transactions (
      transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
      date DATE NOT NULL,
      description TEXT NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      category TEXT NOT NULL,
      payment_method TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_user_id ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transaction_date ON transactions(date);
  `;

  const { error } = await supabase.rpc('execute_sql', { sql });

  if (error) {
    console.error('Migration failed:', error);
  } else {
    console.log('Migration completed successfully.');
  }
}

runMigration();
