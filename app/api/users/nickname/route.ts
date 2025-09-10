import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const nicknameSchema = z.object({
  nickname: z.string()
    .min(2, 'Nickname must be at least 2 characters')
    .max(20, 'Nickname must be at most 20 characters')
    .regex(/^[a-zA-Z0-9\s\-_\.]+$/, 'Nickname contains invalid characters')
});

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
    const { nickname } = nicknameSchema.parse(body);

    const client = await pool.connect();
    
    try {
      // Check if nickname is already taken (case-insensitive)
      const existingNickname = await client.query(
        'SELECT id FROM users WHERE LOWER(nickname) = LOWER($1) AND id != $2',
        [nickname.trim(), user.userId]
      );

      if (existingNickname.rows.length > 0) {
        return NextResponse.json(
          { error: 'This nickname is already taken. Please choose another one.' },
          { status: 400 }
        );
      }

      // Update user's nickname
      await client.query(
        'UPDATE users SET nickname = $1, nickname_set_at = now() WHERE id = $2',
        [nickname.trim(), user.userId]
      );

      return NextResponse.json({
        success: true,
        nickname: nickname.trim(),
        message: 'Nickname set successfully!'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Failed to set nickname:', error);
    return NextResponse.json(
      { error: 'Failed to set nickname' },
      { status: 500 }
    );
  }
}

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
      const result = await client.query(
        'SELECT nickname, nickname_set_at FROM users WHERE id = $1',
        [user.userId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userData = result.rows[0];
      
      return NextResponse.json({
        nickname: userData.nickname,
        hasNickname: !!userData.nickname,
        nicknameSetAt: userData.nickname_set_at
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Failed to get nickname:', error);
    return NextResponse.json(
      { error: 'Failed to get nickname' },
      { status: 500 }
    );
  }
}
