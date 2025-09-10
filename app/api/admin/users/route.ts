import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@lib/auth';
import { pool } from '@lib/db';

export async function GET(req: NextRequest) {
  try {
    // Check authorization
    const auth = req.headers.get('authorization');
    if (!auth) {
      return NextResponse.json({ error: 'missing auth' }, { status: 401 });
    }

    let userId: string;
    try {
      userId = verifyToken(auth.replace('Bearer ', '')).userId;
    } catch {
      return NextResponse.json({ error: 'invalid token' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
      // Check if user is admin
      const userResult = await client.query(
        'SELECT is_admin FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rowCount === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const isAdmin = userResult.rows[0].is_admin;
      if (!isAdmin) {
        return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
      }

      // Get all users with their stats
      const usersResult = await client.query(`
        SELECT 
          u.id,
          u.nickname,
          u.points,
          u.marks,
          u.rank_level,
          u.is_admin,
          u.created_at,
          u.last_weekly_purchase_at,
          COUNT(DISTINCT mt_purchase.id) as total_purchases,
          COALESCE(SUM(CASE WHEN mt_purchase.type = 'PURCHASE' THEN mt_purchase.wld_amount ELSE 0 END), 0) as total_spent_wld,
          COUNT(DISTINCT mt_withdrawal.id) as total_withdrawals,
          COALESCE(SUM(CASE WHEN mt_withdrawal.type = 'WITHDRAWAL' THEN mt_withdrawal.wld_amount ELSE 0 END), 0) as total_withdrawn_wld
        FROM users u
        LEFT JOIN mark_transactions mt_purchase ON u.id = mt_purchase.user_id AND mt_purchase.type = 'PURCHASE'
        LEFT JOIN mark_transactions mt_withdrawal ON u.id = mt_withdrawal.user_id AND mt_withdrawal.type = 'WITHDRAWAL'
        GROUP BY u.id, u.nickname, u.points, u.marks, u.rank_level, u.is_admin, u.created_at, u.last_weekly_purchase_at
        ORDER BY u.created_at DESC
      `);

      return NextResponse.json({
        success: true,
        users: usersResult.rows
      });

    } catch (error) {
      console.error('Admin users API error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
