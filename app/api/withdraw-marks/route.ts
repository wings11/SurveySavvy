import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@lib/auth';
import { pool } from '@lib/db';
import { v4 as uuidv4 } from 'uuid';
import { WORLDCHAIN_CONFIG } from '../../../lib/constants/tokens';
import { validateWithdrawalAmount } from '../../../lib/utils/withdrawal';

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
    const { marksToWithdraw, walletAddress } = body;

    // Validate withdrawal amount using the new constraints
    const validation = validateWithdrawalAmount(marksToWithdraw);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return NextResponse.json({ error: 'Valid wallet address required for withdrawal' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current user marks and check for pending withdrawals
      const userResult = await client.query(
        'SELECT marks FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );

      if (userResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const currentMarks = userResult.rows[0].marks || 0;

      if (currentMarks < marksToWithdraw) {
        await client.query('ROLLBACK');
        return NextResponse.json({ 
          error: `Insufficient marks. You have ${currentMarks} marks but requested ${marksToWithdraw}` 
        }, { status: 400 });
      }

      // Check for existing pending withdrawals
      const pendingWithdrawals = await client.query(
        'SELECT COUNT(*) as count FROM mark_transactions WHERE user_id = $1 AND type = $2 AND status = $3',
        [userId, 'WITHDRAWAL', 'PENDING']
      );

      if (parseInt(pendingWithdrawals.rows[0].count) > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ 
          error: 'You have a pending withdrawal. Please wait for it to be processed before submitting another.' 
        }, { status: 400 });
      }

      // Calculate WLD amount with 20% platform fee
      // Base rate: 500 marks = 0.1 WLD, but with 20% fee = 0.08 WLD
      const baseWldAmount = (marksToWithdraw / WORLDCHAIN_CONFIG.WITHDRAWAL_MULTIPLE) * 0.1;
      const platformFee = baseWldAmount * 0.2;
      const finalWldAmount = baseWldAmount - platformFee;

      // Deduct marks from user
      const newMarks = currentMarks - marksToWithdraw;
      await client.query(
        'UPDATE users SET marks = $1 WHERE id = $2',
        [newMarks, userId]
      );

      // Record withdrawal transaction as PENDING
      const transactionId = uuidv4();
      await client.query(
        'INSERT INTO mark_transactions (user_id, marks_amount, type, wld_amount, tx_hash, status, user_wallet_address) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [userId, -marksToWithdraw, 'WITHDRAWAL', finalWldAmount, transactionId, 'PENDING', walletAddress]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        marksWithdrawn: marksToWithdraw,
        wldAmount: finalWldAmount,
        platformFee: platformFee,
        newBalance: newMarks,
        transactionId: transactionId,
        status: 'PENDING',
        message: 'Withdrawal request submitted. You will receive WLD within 24-48 hours.',
        walletAddress: walletAddress
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Withdraw marks error:', error);
      return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Withdraw marks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
