import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { validateWithdrawalAmount, validateWalletAddress, calculateWldAmount } from '@/lib/utils/withdrawal';
import { sendWldToUser } from '@/lib/blockchain/treasury';

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

    const { marks, walletAddress, deadline, nonce } = await req.json();

    // Validate inputs
    const amountValidation = validateWithdrawalAmount(marks);
    if (!amountValidation.isValid) {
      return NextResponse.json({ error: amountValidation.error }, { status: 400 });
    }

    const addressValidation = validateWalletAddress(walletAddress);
    if (!addressValidation.isValid) {
      return NextResponse.json({ error: addressValidation.error }, { status: 400 });
    }

    // Check user's mark balance
    const userResult = await pool.query(
      'SELECT marks FROM users WHERE id = $1',
      [user.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userMarks = userResult.rows[0].marks;
    if (marks > userMarks) {
      return NextResponse.json({ 
        error: `Insufficient marks. You have ${userMarks} marks available.` 
      }, { status: 400 });
    }

    // Calculate WLD amounts
    const { grossWld, platformFee, netWld, netWldWei } = calculateWldAmount(marks);

    // Perform on-chain transfer first (treasury funded)
    let txHash: string | null = null;
    try {
      txHash = await sendWldToUser(walletAddress as `0x${string}`, netWldWei);
    } catch (chainErr) {
      console.error('On-chain transfer failed:', chainErr);
      return NextResponse.json({ error: 'Treasury transfer failed' }, { status: 502 });
    }

    // Record transaction & deduct marks atomically
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const withdrawalResult = await client.query(`
        INSERT INTO mark_transactions (
          user_id, 
          type, 
          marks_amount, 
          wld_amount, 
          user_wallet_address, 
          status,
          tx_hash,
          deadline,
          nonce
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        user.userId,
        'WITHDRAWAL',
        -marks,
        netWld,
        walletAddress,
        'COMPLETED',
        txHash,
        deadline,
        nonce
      ]);

      const withdrawalId = withdrawalResult.rows[0].id;

      await client.query(
        'UPDATE users SET marks = marks - $1 WHERE id = $2',
        [marks, user.userId]
      );
      await client.query('COMMIT');
      return NextResponse.json({
        success: true,
        withdrawalId,
        txHash,
        details: {
          marksWithdrawn: marks,
          grossWld,
          platformFee,
            netWld: netWld.toFixed(6),
          walletAddress
        }
      });
    } catch (dbErr) {
      await client.query('ROLLBACK');
      console.error('DB error finalizing withdrawal:', dbErr);
      return NextResponse.json({ error: 'Failed to record withdrawal' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Withdrawal processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
