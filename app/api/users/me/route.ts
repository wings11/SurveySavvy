import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@lib/db';
import { verifyToken } from '@lib/auth';
import { computeRankLevel } from '@lib/rank';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return NextResponse.json({ error: 'missing auth' }, { status: 401 });
  
  let userId: string;
  try {
    userId = verifyToken(auth.replace('Bearer ', '')).userId;
  } catch {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 });
  }
  
  const client = await pool.connect();
  try {
    // Get user basic info
    const userResult = await client.query(
      'SELECT id, rank_level, active_survey_id, nickname, nickname_set_at, marks, is_admin FROM users WHERE id=$1',
      [userId]
    );
    
    if (userResult.rowCount === 0) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    // Get total points from points table
    const pointsResult = await client.query(
      'SELECT SUM(points) as total_points FROM points WHERE user_id = $1',
      [userId]
    );

    const totalPoints = parseInt(pointsResult.rows[0]?.total_points || '0');

    // Calculate current rank based on points using the same logic as backend
    const currentRank = computeRankLevel(totalPoints);

    // Update the user's rank if it has changed
    if (currentRank !== userResult.rows[0].rank_level) {
      await client.query('UPDATE users SET rank_level = $1 WHERE id = $2', [currentRank, userId]);
    }

    return NextResponse.json({
      id: userResult.rows[0].id,
      totalPoints,
      totalMarks: userResult.rows[0].marks || 0,
      rank_level: currentRank,
      active_survey_id: userResult.rows[0].active_survey_id,
      nickname: userResult.rows[0].nickname,
      hasNickname: !!userResult.rows[0].nickname,
      nickname_set_at: userResult.rows[0].nickname_set_at,
      isAdmin: userResult.rows[0].is_admin || false
    });
  } finally {
    client.release();
  }
}
