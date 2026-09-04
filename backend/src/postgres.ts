import { Pool } from 'pg';

// One shared connection to Postgres. Reads DATABASE_URL from .env
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
