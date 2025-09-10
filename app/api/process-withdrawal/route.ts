import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@lib/auth';
import { withDbConnection } from '@lib/db';
import { v4 as uuidv4 } from 'uuid';
import { validateWithdrawalAmount, validateWalletAddress, calculateWldAmount } from '@/lib/utils/withdrawal';

export async function POST(req: NextRequest) {
  try {
    // Check authorization
    const auth = req.headers.get('authorization');
    if (!auth) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }

    let userId: string;
    try {
      userId = verifyToken(auth.replace('Bearer ', '')).userId;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      marksToWithdraw, 
      walletAddress, 
      wldAmount, 
      wldAmountWei, 
      platformFee, 
      permit2Nonce, 
      transactionId 
    } = body;

    // Validate inputs
    const marksValidation = validateWithdrawalAmount(marksToWithdraw);
    if (!marksValidation.isValid) {
      return NextResponse.json({ error: marksValidation.error }, { status: 400 });
    }

    const addressValidation = validateWalletAddress(walletAddress);
    if (!addressValidation.isValid) {
      return NextResponse.json({ error: addressValidation.error }, { status: 400 });
    }

    if (!transactionId || !permit2Nonce) {
      return NextResponse.json({ error: 'Missing transaction details' }, { status: 400 });
    }

    // Verify calculation matches server-side calculation
    const serverCalc = calculateWldAmount(marksToWithdraw);
    if (Math.abs(serverCalc.netWld - wldAmount) > 0.000001) {
      return NextResponse.json({ error: 'Amount calculation mismatch' }, { status: 400 });
    }

    return await withDbConnection(async (client) => {
      await client.query('BEGIN');

      try {
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

        // Check for existing pending/processing withdrawals
        const pendingWithdrawals = await client.query(
          'SELECT COUNT(*) as count FROM mark_transactions WHERE user_id = $1 AND type = $2 AND status IN ($3, $4)',
          [userId, 'WITHDRAWAL', 'PENDING', 'PROCESSING']
        );

        if (parseInt(pendingWithdrawals.rows[0].count) > 0) {
          await client.query('ROLLBACK');
          return NextResponse.json({ 
            error: 'You have a pending withdrawal. Please wait for it to be processed before submitting another.' 
          }, { status: 400 });
        }

        // Check for duplicate nonce
        const nonceCheck = await client.query(
          'SELECT id FROM mark_transactions WHERE permit2_nonce = $1',
          [permit2Nonce]
        );

        if (nonceCheck.rowCount > 0) {
          await client.query('ROLLBACK');
          return NextResponse.json({ 
            error: 'Duplicate transaction detected' 
          }, { status: 400 });
        }

        // Deduct marks from user
        const newMarks = currentMarks - marksToWithdraw;
        await client.query(
          'UPDATE users SET marks = $1 WHERE id = $2',
          [newMarks, userId]
        );

        // Record withdrawal transaction as PROCESSING
        const withdrawalId = uuidv4();
        await client.query(
          `INSERT INTO mark_transactions (
            id, user_id, type, marks_amount, wld_amount, wld_amount_wei, 
            tx_hash, permit2_nonce, status, user_wallet_address, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
          [
            withdrawalId, userId, 'WITHDRAWAL', -marksToWithdraw, 
            wldAmount, wldAmountWei, transactionId, permit2Nonce, 
            'PROCESSING', walletAddress
          ]
        );

        await client.query('COMMIT');

        return NextResponse.json({
          success: true,
          withdrawalId,
          marksWithdrawn: marksToWithdraw,
          wldAmount: wldAmount,
          platformFee: platformFee,
          newBalance: newMarks,
          transactionId: transactionId,
          status: 'PROCESSING',
          message: 'Withdrawal is being processed. You should receive WLD shortly.',
          walletAddress: walletAddress
        });

      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Process withdrawal error:', error);
        return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
      }
    });

  } catch (error) {
    console.error('Process withdrawal API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
