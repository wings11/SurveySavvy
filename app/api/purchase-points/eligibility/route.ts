import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    const client = await pool.connect();
    
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Check daily purchases today
      const dailyPurchases = await client.query(
        `SELECT COUNT(*) as count FROM point_purchases 
         WHERE user_id = $1 AND package_type = 'daily' 
         AND created_at >= $2 AND status = 'completed'`,
        [user.userId, today]
      );

      const dailyPurchasesToday = parseInt(dailyPurchases.rows[0].count);

      // Check last weekly purchase
      const weeklyPurchase = await client.query(
        `SELECT created_at FROM point_purchases 
         WHERE user_id = $1 AND package_type = 'weekly' 
         AND status = 'completed' 
         ORDER BY created_at DESC LIMIT 1`,
        [user.userId]
      );

      let canPurchaseDaily = false;
      let canPurchaseWeekly = false;
      let daysUntilNextPurchase = 0;
      let lastWeeklyPurchase = null;

      if (weeklyPurchase.rows.length > 0) {
        lastWeeklyPurchase = weeklyPurchase.rows[0].created_at;
        const daysSinceWeekly = Math.floor((now.getTime() - new Date(lastWeeklyPurchase).getTime()) / (24 * 60 * 60 * 1000));
        daysUntilNextPurchase = Math.max(0, 7 - daysSinceWeekly);

        // If 7 days have passed since weekly purchase, user can purchase again
        if (daysSinceWeekly >= 7) {
          canPurchaseDaily = dailyPurchasesToday < 1;
          canPurchaseWeekly = true;
        } else {
          // Still in weekly cooldown
          canPurchaseDaily = false;
          canPurchaseWeekly = false;
        }
      } else {
        // No weekly purchases yet, can purchase based on daily limit
        canPurchaseDaily = dailyPurchasesToday < 1;
        canPurchaseWeekly = true;
      }

      return NextResponse.json({
        canPurchaseDaily,
        canPurchaseWeekly,
        dailyPurchasesToday,
        lastWeeklyPurchase,
        daysUntilNextPurchase
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Failed to check purchase eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to check purchase eligibility' },
      { status: 500 }
    );
  }
}
