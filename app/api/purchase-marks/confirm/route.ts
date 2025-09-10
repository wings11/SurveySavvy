import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@lib/auth';
import { pool } from '@lib/db';
import { v4 as uuidv4 } from 'uuid';

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
    const { packageId, paymentReference, transactionId, amount } = body;

    if (!packageId || !paymentReference || !transactionId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Define available packages
    const packages = {
      marks_tiny: { marks: 10, wld: 0.1, name: 'Tiny Pack' },
      marks_small: { marks: 50, wld: 0.5, name: 'Small Pack' },
      marks_medium: { marks: 100, wld: 0.95, name: 'Medium Pack' },
      marks_large: { marks: 500, wld: 4.5, name: 'Large Pack' },
      marks_xlarge: { marks: 1000, wld: 8.0, name: 'XLarge Pack' }
    };

    const selectedPackage = packages[packageId as keyof typeof packages];
    if (!selectedPackage) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if this purchase was already recorded
      const existingPurchase = await client.query(
        'SELECT * FROM mark_purchases WHERE transaction_id = $1',
        [transactionId]
      );

      if (existingPurchase.rowCount && existingPurchase.rowCount > 0) {
        const purchase = existingPurchase.rows[0];
        if (purchase.status === 'completed') {
          await client.query('ROLLBACK');
          return NextResponse.json({ 
            success: true, 
            message: 'Purchase already processed',
            marksAdded: purchase.marks_amount 
          });
        }
      }

      // Get current user marks
      const userResult = await client.query(
        'SELECT marks FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );

      if (userResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const currentMarks = userResult.rows[0].marks || 0;

      // Check if adding marks would exceed limit
      if (currentMarks + selectedPackage.marks > 5000) {
        await client.query('ROLLBACK');
        return NextResponse.json({ 
          error: `Would exceed maximum of 5000 marks. You have ${currentMarks} marks.` 
        }, { status: 400 });
      }

      // Update or create purchase record
      if (existingPurchase.rowCount && existingPurchase.rowCount > 0) {
        await client.query(
          'UPDATE mark_purchases SET status = $1 WHERE transaction_id = $2',
          ['completed', transactionId]
        );
      } else {
        // Create new purchase record
        const purchaseId = uuidv4();
        await client.query(
          'INSERT INTO mark_purchases (id, user_id, package_type, marks_amount, wld_amount, payment_reference, transaction_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [purchaseId, userId, packageId, selectedPackage.marks, selectedPackage.wld, paymentReference, transactionId, 'completed']
        );
      }

      // Add marks to user (respecting cap)
      const maxMarks = 500; // From WORLDCHAIN_CONFIG.MAX_MARKS_CAP
      const availableSpace = Math.max(0, maxMarks - currentMarks);
      const actualMarksToAdd = Math.min(selectedPackage.marks, availableSpace);
      const newMarks = currentMarks + actualMarksToAdd;
      
      if (actualMarksToAdd <= 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ 
          error: 'Cannot purchase marks: You have reached the maximum marks limit (500 marks)' 
        }, { status: 400 });
      }
      
      if (actualMarksToAdd < selectedPackage.marks) {
        await client.query('ROLLBACK');
        return NextResponse.json({ 
          error: `Cannot purchase full amount: You can only add ${actualMarksToAdd} more marks (current: ${currentMarks}/500)` 
        }, { status: 400 });
      }
      
      await client.query(
        'UPDATE users SET marks = $1, last_weekly_purchase_at = $2 WHERE id = $3',
        [newMarks, new Date(), userId]
      );

      // Record marks transaction
      await client.query(
        'INSERT INTO mark_transactions (user_id, marks_amount, type, wld_amount, tx_hash) VALUES ($1, $2, $3, $4, $5)',
        [userId, actualMarksToAdd, 'PURCHASE', selectedPackage.wld, transactionId]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        marksAdded: selectedPackage.marks,
        newBalance: newMarks,
        packageName: selectedPackage.name
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Confirm marks purchase error:', error);
      return NextResponse.json({ error: 'Failed to confirm purchase' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Confirm marks purchase API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
