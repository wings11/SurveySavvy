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

      // Get all pending withdrawals
      const withdrawalsResult = await client.query(`
        SELECT 
          mt.id,
          mt.user_id,
          u.nickname,
          mt.marks_amount,
          mt.wld_amount,
          mt.user_wallet_address,
          mt.tx_hash,
          mt.status,
          mt.created_at
        FROM mark_transactions mt
        JOIN users u ON mt.user_id = u.id
        WHERE mt.type = 'WITHDRAWAL' AND mt.status = 'PENDING'
        ORDER BY mt.created_at ASC
      `);

      return NextResponse.json({
        success: true,
        withdrawals: withdrawalsResult.rows
      });

    } catch (error) {
      console.error('Admin withdrawals API error:', error);
      return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Admin withdrawals API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { withdrawalId, action, txHash } = body; // action: 'approve' or 'reject'

    if (!withdrawalId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user is admin
      const userResult = await client.query(
        'SELECT is_admin FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const isAdmin = userResult.rows[0].is_admin;
      if (!isAdmin) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
      }

      // Get the withdrawal transaction
      const withdrawalResult = await client.query(
        'SELECT * FROM mark_transactions WHERE id = $1 AND type = $2 AND status = $3 FOR UPDATE',
        [withdrawalId, 'WITHDRAWAL', 'PENDING']
      );

      if (withdrawalResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Withdrawal not found or already processed' }, { status: 404 });
      }

      const withdrawal = withdrawalResult.rows[0];

      if (action === 'approve') {
        // Approve withdrawal - mark as completed
        if (!txHash) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: 'Transaction hash required for approval' }, { status: 400 });
        }

        await client.query(
          'UPDATE mark_transactions SET status = $1, tx_hash = $2 WHERE id = $3',
          ['COMPLETED', txHash, withdrawalId]
        );

      } else if (action === 'reject') {
        // Reject withdrawal - refund marks to user
        await client.query(
          'UPDATE mark_transactions SET status = $1 WHERE id = $2',
          ['REJECTED', withdrawalId]
        );

        // Refund marks to user (withdrawal.marks_amount is negative, so we subtract it to add back)
        await client.query(
          'UPDATE users SET marks = marks + $1 WHERE id = $2',
          [-withdrawal.marks_amount, withdrawal.user_id]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Withdrawal ${action}d successfully`,
        withdrawalId: withdrawalId,
        action: action
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Admin withdrawal action error:', error);
      return NextResponse.json({ error: 'Failed to process withdrawal action' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Admin withdrawal action API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
