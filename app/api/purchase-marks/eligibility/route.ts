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
      // Get user's current marks and last purchase time
      const userResult = await client.query(
        'SELECT marks, last_weekly_purchase_at FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rowCount === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const user = userResult.rows[0];
      const currentMarks = user.marks || 0;
      const lastPurchase = user.last_weekly_purchase_at;

      // Check if user has made a purchase in the last 7 days
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const hasRecentPurchase = lastPurchase && new Date(lastPurchase) > oneWeekAgo;

      // Check for pending purchases
      const pendingResult = await client.query(
        'SELECT COUNT(*) as pending_count FROM mark_purchases WHERE user_id = $1 AND status = $2',
        [userId, 'pending']
      );

      const pendingPurchases = parseInt(pendingResult.rows[0].pending_count);

      return NextResponse.json({
        eligible: true, // Always eligible for marks (no weekly limit like points)
        currentMarks,
        maxMarks: 5000, // User limit
        canPurchase: currentMarks < 5000 && pendingPurchases === 0,
        pendingPurchases,
        hasRecentPurchase,
        packages: [
          {
            id: 'marks_small',
            name: 'Small Pack',
            marks: 100,
            wld: 1.0,
            description: '100 Marks for 1 WLD'
          },
          {
            id: 'marks_medium',
            name: 'Medium Pack',
            marks: 500,
            wld: 5.0,
            description: '500 Marks for 5 WLD'
          },
          {
            id: 'marks_large',
            name: 'Large Pack',
            marks: 1000,
            wld: 10.0,
            description: '1000 Marks for 10 WLD'
          }
        ]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Marks eligibility API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
