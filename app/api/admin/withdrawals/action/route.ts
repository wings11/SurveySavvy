import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const adminResult = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [user.userId]
    );

    if (adminResult.rows.length === 0 || !adminResult.rows[0].is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { withdrawalId, action } = await req.json();

    if (!withdrawalId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid withdrawalId or action' },
        { status: 400 }
      );
    }

    // Get withdrawal details
    const withdrawalResult = await pool.query(
      'SELECT * FROM mark_transactions WHERE id = $1 AND type = $2',
      [withdrawalId, 'WITHDRAWAL']
    );

    if (withdrawalResult.rows.length === 0) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }

    const withdrawal = withdrawalResult.rows[0];

    if (action === 'approve') {
      // This is now handled automatically by the system
      // But we can update status for legacy withdrawals
      await pool.query(
        'UPDATE mark_transactions SET status = $1 WHERE id = $2',
        ['COMPLETED', withdrawalId]
      );
    } else if (action === 'reject') {
      // Refund marks to user
      await pool.query(`
        UPDATE users SET marks = marks + $1 WHERE id = $2;
        UPDATE mark_transactions SET status = 'CANCELLED' WHERE id = $3;
      `, [Math.abs(withdrawal.marks_amount), withdrawal.user_id, withdrawalId]);
    }

    return NextResponse.json({
      success: true,
      message: `Withdrawal ${action}d successfully`
    });

  } catch (error) {
    console.error('Admin withdrawal action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}