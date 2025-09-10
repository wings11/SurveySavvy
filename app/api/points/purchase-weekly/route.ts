import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@lib/db';
import { verifyToken } from '@lib/auth';
import { computeRankLevel } from '@lib/rank';

export async function POST(req:NextRequest){
  const auth = req.headers.get('authorization');
  if(!auth) return NextResponse.json({error:'missing auth'},{status:401});
  let userId:string; try { userId = verifyToken(auth.replace('Bearer ', '')).userId; } catch { return NextResponse.json({error:'invalid token'},{status:401}); }
  const weeklyAmount = parseInt(process.env.PURCHASE_WEEKLY_POINTS||'10',10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const u = await client.query('SELECT id, last_weekly_purchase_at, points FROM users WHERE id=$1 FOR UPDATE',[userId]);
    if(u.rowCount===0){ await client.query('ROLLBACK'); return NextResponse.json({error:'user not found'},{status:404}); }
    const user = u.rows[0];
    if(user.last_weekly_purchase_at){
      const last = new Date(user.last_weekly_purchase_at);
      const diffDays = (Date.now() - last.getTime())/(1000*60*60*24);
      if(diffDays < 7){ await client.query('ROLLBACK'); return NextResponse.json({error:'already purchased this week'},{status:429}); }
    }
    await client.query('INSERT INTO helper_points_transactions(id,user_id,type,points_awarded) VALUES(gen_random_uuid(),$1,$2,$3)', [userId, 'PURCHASE', weeklyAmount]);
    const newPointsRes = await client.query('UPDATE users SET points = points + $1, last_weekly_purchase_at=now() WHERE id=$2 RETURNING points',[weeklyAmount, userId]);
    const newPts = newPointsRes.rows[0].points;
    const newRank = computeRankLevel(newPts);
    await client.query('UPDATE users SET rank_level=$1 WHERE id=$2',[newRank, userId]);
    await client.query('COMMIT');
    return NextResponse.json({ purchased: weeklyAmount, total_points: newPts, rank_level: newRank });
  } catch(e){ await client.query('ROLLBACK'); return NextResponse.json({error:'internal'},{status:500}); } finally { client.release(); }
}
