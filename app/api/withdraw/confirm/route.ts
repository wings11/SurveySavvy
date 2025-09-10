import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { withdrawalId, transactionId } = await req.json();

    if (!withdrawalId || !transactionId) {
      return NextResponse.json(
        { error: 'Missing withdrawalId or transactionId' },
        { status: 400 }
      );
    }

    const updateResult = await pool.query(`
      UPDATE mark_transactions 
      SET 
        transaction_id = $1,
        status = 'PROCESSING'
      WHERE id = $2 AND user_id = $3 AND type = 'WITHDRAWAL'
      RETURNING *
    `, [transactionId, withdrawalId, user.userId]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Withdrawal not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction ID updated successfully',
      withdrawal: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Transaction confirmation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Missing transactionId parameter' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${transactionId}?app_id=${process.env.APP_ID}&type=transaction`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.DEV_PORTAL_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch transaction status' },
        { status: 500 }
      );
    }

    const transactionData = await response.json();

    if (transactionData.transactionStatus === 'confirmed') {
      await pool.query(`
        UPDATE mark_transactions 
        SET 
          status = 'COMPLETED',
          tx_hash = $1
        WHERE transaction_id = $2 AND user_id = $3
      `, [transactionData.transactionHash, transactionId, user.userId]);
    } else if (transactionData.transactionStatus === 'failed') {
      const withdrawalResult = await pool.query(`
        SELECT marks_amount FROM mark_transactions 
        WHERE transaction_id = $1 AND user_id = $2
      `, [transactionId, user.userId]);

      if (withdrawalResult.rows.length > 0) {
        const marksToRefund = Math.abs(withdrawalResult.rows[0].marks_amount);
        
        await pool.query(`
          UPDATE users SET marks = marks + $1 WHERE id = $2;
          UPDATE mark_transactions SET status = 'FAILED' WHERE transaction_id = $3 AND user_id = $2;
        `, [marksToRefund, user.userId, transactionId]);
      }
    }

    return NextResponse.json({
      success: true,
      transactionStatus: transactionData.transactionStatus,
      transactionHash: transactionData.transactionHash,
      data: transactionData
    });

  } catch (error) {
    console.error('Transaction status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
