import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@lib/db';
import { verifyToken } from '@lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    let userId;
    try {
      const decoded = verifyToken(token);
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT wallet_address FROM users WHERE id = $1',
        [userId]
      );

      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const walletAddress = result.rows[0].wallet_address;
      return NextResponse.json({ 
        walletAddress: walletAddress || null,
        hasWallet: !!walletAddress
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting user wallet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    let userId;
    try {
      const decoded = verifyToken(token);
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { walletAddress } = await req.json();
    
    if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query(
        'UPDATE users SET wallet_address = $1 WHERE id = $2',
        [walletAddress, userId]
      );

      return NextResponse.json({ 
        success: true,
        walletAddress
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating user wallet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
