import { NextRequest, NextResponse } from 'next/server';
import { withDbConnection } from '@lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
    }

    // Get transaction details from World's API
    const response = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${transactionId}?app_id=${process.env.WLD_CLIENT_ID}&type=transaction`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.DEV_PORTAL_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch transaction details:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch transaction details' }, { status: 500 });
    }

    const transaction = await response.json();
    
    return await withDbConnection(async (client) => {
      // Find the withdrawal transaction
      const withdrawalResult = await client.query(
        'SELECT * FROM mark_transactions WHERE tx_hash = $1 AND type = $2',
        [transactionId, 'WITHDRAWAL']
      );

      if (withdrawalResult.rowCount === 0) {
        return NextResponse.json({ error: 'Withdrawal transaction not found' }, { status: 404 });
      }

      const withdrawal = withdrawalResult.rows[0];

      // Update transaction status based on blockchain status
      let newStatus = 'PROCESSING';
      let blockchainTxHash = null;
      let failureReason = null;

      if (transaction.transactionStatus === 'success') {
        newStatus = 'COMPLETED';
        blockchainTxHash = transaction.transactionHash;
      } else if (transaction.transactionStatus === 'failed') {
        newStatus = 'FAILED';
        failureReason = transaction.failureReason || 'Transaction failed on blockchain';
        
        // Refund marks to user if transaction failed
        await client.query(
          'UPDATE users SET marks = marks + $1 WHERE id = $2',
          [Math.abs(withdrawal.marks_amount), withdrawal.user_id]
        );
      }

      // Update withdrawal record
      await client.query(
        `UPDATE mark_transactions 
         SET status = $1, blockchain_tx_hash = $2, failure_reason = $3, updated_at = NOW() 
         WHERE id = $4`,
        [newStatus, blockchainTxHash, failureReason, withdrawal.id]
      );

      return NextResponse.json({
        success: true,
        transaction: {
          ...withdrawal,
          status: newStatus,
          blockchain_tx_hash: blockchainTxHash,
          failure_reason: failureReason
        },
        blockchainTransaction: transaction
      });
    });

  } catch (error) {
    console.error('Confirm withdrawal API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
