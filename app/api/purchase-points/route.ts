import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const purchaseSchema = z.object({
  pointPackage: z.enum(['daily', 'weekly']),
  paymentReference: z.string(),
  transactionId: z.string(),
  amount: z.number().positive()
});

// Point packages with WLD prices and cooldown periods
const POINT_PACKAGES = {
  daily: { points: 10, wldPrice: 0.05, description: '10 points for 0.05 WLD', cooldownDays: 1 },
  weekly: { points: 70, wldPrice: 0.3, description: '70 points for 0.3 WLD', cooldownDays: 7 }
};

export async function GET() {
  try {
    return NextResponse.json({
      packages: POINT_PACKAGES
    });
  } catch (error) {
    console.error('Failed to get point packages:', error);
    return NextResponse.json(
      { error: 'Failed to get point packages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { pointPackage, paymentReference, transactionId, amount } = purchaseSchema.parse(body);

    const packageInfo = POINT_PACKAGES[pointPackage];
    if (!packageInfo) {
      return NextResponse.json(
        { error: 'Invalid point package' },
        { status: 400 }
      );
    }

    // Verify the payment amount matches the package price
    if (Math.abs(amount - packageInfo.wldPrice) > 0.001) {
      return NextResponse.json(
        { error: 'Payment amount does not match package price' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check purchase eligibility
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (pointPackage === 'daily') {
        // Check daily limit (1 purchase per day)
        const dailyPurchases = await client.query(
          `SELECT COUNT(*) as count FROM point_purchases 
           WHERE user_id = $1 AND package_type = 'daily' 
           AND created_at >= $2 AND status = 'completed'`,
          [user.userId, today]
        );

        if (parseInt(dailyPurchases.rows[0].count) >= 1) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { error: 'Daily purchase limit reached. You can buy again tomorrow.' },
            { status: 400 }
          );
        }

        // Check if user is in weekly cooldown
        const weeklyPurchase = await client.query(
          `SELECT created_at FROM point_purchases 
           WHERE user_id = $1 AND package_type = 'weekly' 
           AND created_at > $2 AND status = 'completed' 
           ORDER BY created_at DESC LIMIT 1`,
          [user.userId, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)]
        );

        if (weeklyPurchase.rows.length > 0) {
          const daysSinceWeekly = Math.floor((now.getTime() - new Date(weeklyPurchase.rows[0].created_at).getTime()) / (24 * 60 * 60 * 1000));
          const remainingDays = 7 - daysSinceWeekly;
          await client.query('ROLLBACK');
          return NextResponse.json(
            { error: `You're in weekly purchase cooldown. ${remainingDays} days remaining.` },
            { status: 400 }
          );
        }
      } else if (pointPackage === 'weekly') {
        // Check if user is in weekly cooldown
        const lastWeeklyPurchase = await client.query(
          `SELECT created_at FROM point_purchases 
           WHERE user_id = $1 AND package_type = 'weekly' 
           AND created_at > $2 AND status = 'completed' 
           ORDER BY created_at DESC LIMIT 1`,
          [user.userId, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)]
        );

        if (lastWeeklyPurchase.rows.length > 0) {
          const daysSinceWeekly = Math.floor((now.getTime() - new Date(lastWeeklyPurchase.rows[0].created_at).getTime()) / (24 * 60 * 60 * 1000));
          const remainingDays = 7 - daysSinceWeekly;
          await client.query('ROLLBACK');
          return NextResponse.json(
            { error: `Weekly purchase cooldown active. ${remainingDays} days remaining.` },
            { status: 400 }
          );
        }
      }

      // Check if this transaction has already been processed
      const existingPurchase = await client.query(
        'SELECT id FROM point_purchases WHERE transaction_id = $1',
        [transactionId]
      );

      if (existingPurchase.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Transaction already processed' },
          { status: 400 }
        );
      }

      // Record the point purchase
      await client.query(
        `INSERT INTO point_purchases 
         (user_id, package_type, points_amount, wld_amount, payment_reference, transaction_id, status) 
         VALUES ($1, $2, $3, $4, $5, $6, 'completed')`,
        [user.userId, pointPackage, packageInfo.points, packageInfo.wldPrice, paymentReference, transactionId]
      );

      // Add points to user's balance
      await client.query(
        `INSERT INTO points (user_id, points, source, description) 
         VALUES ($1, $2, 'purchase', $3)`,
        [user.userId, packageInfo.points, `Purchased ${packageInfo.description}`]
      );

      await client.query('COMMIT');

      // Get updated points balance
      const pointsResult = await client.query(
        'SELECT SUM(points) as total_points FROM points WHERE user_id = $1',
        [user.userId]
      );

      const totalPoints = parseInt(pointsResult.rows[0]?.total_points || '0');

      return NextResponse.json({
        success: true,
        purchasedPoints: packageInfo.points,
        totalPoints,
        message: `Successfully purchased ${packageInfo.points} points!`,
        cooldownDays: packageInfo.cooldownDays
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Point purchase failed:', error);
    return NextResponse.json(
      { error: 'Point purchase failed' },
      { status: 500 }
    );
  }
}
