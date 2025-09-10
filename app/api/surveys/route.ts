import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@lib/db';
import { z } from 'zod';
import { verifyToken } from '@lib/auth';

export async function GET(req:NextRequest){
  const client = await pool.connect();
  try {
    const r = await client.query(`SELECT s.id, s.description, s.goal_count, s.boost_marks, s.verified_count, s.created_at, s.owner_user_id, u.rank_level, u.nickname,
      (CASE WHEN s.goal_count>0 THEN (s.verified_count::decimal / s.goal_count) ELSE 0 END) AS completion_ratio
      FROM surveys s JOIN users u ON u.id=s.owner_user_id WHERE s.status='OPEN'
      ORDER BY s.boost_marks DESC, u.rank_level DESC, completion_ratio ASC, s.created_at ASC LIMIT 50`);
    return NextResponse.json({ items: r.rows });
  } finally { client.release(); }
}

export async function POST(req:NextRequest){
  const auth = req.headers.get('authorization');
  if(!auth) return NextResponse.json({error:'missing auth'}, { status:401 });
  let userId:string;
  try { const token = auth.replace('Bearer ',''); userId = verifyToken(token).userId; } catch { return NextResponse.json({error:'invalid token'},{status:401}); }
  const schema = z.object({ 
    description: z.string().min(5).max(2000), 
    target_url: z.string().url(), 
    goal_count: z.number().int().min(1).max(3000),
    boost_marks: z.number().int().min(0).max(3000).optional().default(0)
  });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if(!parsed.success) return NextResponse.json({error:'invalid_input'}, { status:400 });
  const { description, target_url, goal_count, boost_marks } = parsed.data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const u = await client.query('SELECT active_survey_id, marks FROM users WHERE id=$1 FOR UPDATE',[userId]);
    if(u.rowCount===0){ await client.query('ROLLBACK'); return NextResponse.json({error:'user not found'},{status:404}); }
    if(u.rows[0].active_survey_id){ await client.query('ROLLBACK'); return NextResponse.json({error:'active survey exists'},{status:409}); }
    
    // Check if user has enough marks for boost
    if(boost_marks > 0 && u.rows[0].marks < boost_marks){
      await client.query('ROLLBACK'); 
      return NextResponse.json({error:'insufficient marks'},{status:400});
    }
    
    const { v4: uuidv4 } = await import('uuid');
    const surveyId = uuidv4();
    
    // Create survey with boost
    await client.query('INSERT INTO surveys(id, owner_user_id, description, target_url, goal_count, boost_marks) VALUES($1,$2,$3,$4,$5,$6)', 
      [surveyId, userId, description, target_url, goal_count, boost_marks]);
    
    // Deduct marks if boosted
    if(boost_marks > 0){
      await client.query('UPDATE users SET marks = marks - $1 WHERE id=$2', [boost_marks, userId]);
      await client.query('INSERT INTO mark_transactions(id,user_id,survey_id,type,marks_amount) VALUES($1,$2,$3,$4,$5)',
        [uuidv4(), userId, surveyId, 'SURVEY_BOOST', -boost_marks]);
    }
    
    await client.query('UPDATE users SET active_survey_id=$1 WHERE id=$2',[surveyId, userId]);
    await client.query('COMMIT');
    return NextResponse.json({ id: surveyId });
  } catch(e){ await client.query('ROLLBACK'); return NextResponse.json({error:'internal'},{status:500}); } finally { client.release(); }
}
