import { NextResponse } from 'next/server';
import { pool } from '@lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      return NextResponse.json({ 
        status: 'ok', 
        timestamp: result.rows[0].current_time,
        version: result.rows[0].version.split(' ')[0]
      });
    } finally {
      client.release();
    }
  } catch (e: any) {
    return NextResponse.json({ 
      status: 'error', 
      error: e.message,
      code: e.code 
    }, { status: 500 });
  }
}
