import { Pool } from 'pg';

if(!process.env.DATABASE_URL){
  throw new Error('DATABASE_URL missing');
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  max: 3, // Reduced from 10 to avoid connection limits
  min: 1, // Keep at least 1 connection alive
  idleTimeoutMillis: 60000, // 60 seconds - keep connections longer
  connectionTimeoutMillis: 15000, // 15 seconds - longer timeout
  statement_timeout: 60000, // 60 seconds - longer query timeout
  query_timeout: 60000, // 60 seconds
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

export async function withDbConnection<T>(operation: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await operation(client);
  } catch (error) {
    console.error('Database operation error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Handle connection pool errors
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
  pool.end(() => {
    console.log('Database pool has ended');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  pool.end(() => {
    console.log('Database pool has ended');
    process.exit(0);
  });
});
