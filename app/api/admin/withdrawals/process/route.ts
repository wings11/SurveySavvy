import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// This endpoint is for legacy manual withdrawal processing
// New automatic withdrawals use /api/withdraw/process instead
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

    // Check if user is admin
    const adminResult = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [user.userId]
    );

    if (adminResult.rows.length === 0 || !adminResult.rows[0].is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({
      message: 'This endpoint is deprecated. Withdrawals are now processed automatically.',
      automaticWithdrawalsEnabled: true
    });

  } catch (error) {
    console.error('Admin withdrawal process error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}