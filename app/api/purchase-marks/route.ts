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
    const { packageId } = body;

    // Define available packages
    const packages: Record<string, { marks: number; wld: number; name: string }> = {
      marks_small: { marks: 100, wld: 1.0, name: 'Small Pack' },
      marks_medium: { marks: 500, wld: 5.0, name: 'Medium Pack' },
      marks_large: { marks: 1000, wld: 10.0, name: 'Large Pack' }
    };

    const selectedPackage = packages[packageId as keyof typeof packages];
    if (!selectedPackage) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check user eligibility
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

      // Check for pending purchases
      const pendingResult = await client.query(
        'SELECT COUNT(*) as pending_count FROM mark_purchases WHERE user_id = $1 AND status = $2',
        [userId, 'pending']
      );

      if (parseInt(pendingResult.rows[0].pending_count) > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ 
          error: 'You have a pending purchase. Please wait for it to complete.' 
        }, { status: 400 });
      }

      // Create purchase record
      const purchaseId = uuidv4();
      const transactionId = `marks_${Date.now()}_${purchaseId.slice(0, 8)}`;
      const paymentReference = `MARKS_${selectedPackage.name.toUpperCase().replace(' ', '_')}_${Date.now()}`;

      await client.query(
        'INSERT INTO mark_purchases (id, user_id, package_type, marks_amount, wld_amount, payment_reference, transaction_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [purchaseId, userId, packageId, selectedPackage.marks, selectedPackage.wld, paymentReference, transactionId, 'pending']
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        purchaseId,
        transactionId,
        paymentReference,
        package: selectedPackage,
        wldAmount: selectedPackage.wld
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create marks purchase error:', error);
      return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Purchase marks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
