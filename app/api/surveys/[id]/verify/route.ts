import { NextRequest, NextResponse } from 'next/server';
import { pool, withDbConnection } from '@lib/db';
import { verifyToken } from '@lib/auth';
import { pointsPerHelper } from '@lib/points';
import { calculateMarksDistribution, validateMarksLimits } from '@lib/marks';
import { computeRankLevel } from '@lib/rank';
import { verifyWorldIdPayload } from '@lib/worldid';

export async function POST(req:NextRequest, { params }: { params: Promise<{ id:string }> }){
  const { id: surveyId } = await params;
  const auth = req.headers.get('authorization');
  if(!auth) return NextResponse.json({error:'missing auth'},{status:401});
  let userId:string;
  try { userId = verifyToken(auth.replace('Bearer ', '')).userId; } catch { return NextResponse.json({error:'invalid token'},{status:401}); }
  const body = await req.json();
  const { payload, action, signal } = body || {};
  if(!payload) return NextResponse.json({error:'missing payload'},{status:400});
  
  
  console.log('Verification attempt:', { surveyId, action, signal, payloadKeys: Object.keys(payload || {}) });
  
  // Verify world id proof
  try { 
    await verifyWorldIdPayload(payload, action || 'surveyformverification', signal); 
  } catch (error) { 
    console.error('World ID verification failed:', error);
    return NextResponse.json({error:'verification_failed', details: String(error)},{status:400}); 
  }

  // Database operations with enhanced connection handling
  try {
    const result = await withDbConnection(async (client) => {
      await client.query('BEGIN');
      
      const s = await client.query('SELECT * FROM surveys WHERE id=$1 FOR UPDATE',[surveyId]);
      if(s.rowCount===0){ 
        await client.query('ROLLBACK'); 
        throw new Error('NOT_FOUND');
      }
      const survey = s.rows[0];
      if(survey.status !== 'OPEN'){ 
        await client.query('ROLLBACK'); 
        throw new Error('CLOSED');
      }
      if(survey.owner_user_id === userId){ 
        await client.query('ROLLBACK'); 
        throw new Error('OWNER_CANNOT_HELP');
      }
      
      console.log('Survey details:', { 
        id: survey.id, 
        boost_marks: survey.boost_marks, 
        goal_count: survey.goal_count,
        verified_count: survey.verified_count 
      });
      
      const nullifier = (payload as any).nullifier_hash;
      const { v4: uuidv4 } = await import('uuid');
      
      // Insert verification record
      try {
        await client.query(
          'INSERT INTO survey_verifications(id, survey_id, helper_user_id, world_nullifier_hash) VALUES($1,$2,$3,$4)', 
          [uuidv4(), surveyId, userId, nullifier]
        );
      } catch(e:any){
        if(e.code==='23505'){ 
          await client.query('ROLLBACK'); 
          throw new Error('DUPLICATE');
        }
        throw e;
      }
      
      // Update survey count
      const upd = await client.query(
        'UPDATE surveys SET verified_count = verified_count + 1 WHERE id=$1 RETURNING verified_count, goal_count',
        [surveyId]
      );
      const { verified_count, goal_count } = upd.rows[0];
      
      // Handle points and ranking
      const cap = parseInt(process.env.HELP_POINTS_DAILY_CAP||'500',10);
      const dayAgg = await client.query(
        "SELECT COALESCE(SUM(points_awarded),0) AS pts FROM helper_points_transactions WHERE user_id=$1 AND type='HELP' AND created_at::date = CURRENT_DATE", 
        [userId]
      );
      const todayPts = parseInt(dayAgg.rows[0].pts,10);
      let awarded = 0;
      const per = pointsPerHelper(goal_count);
      
      // Check if survey is boosted and calculate marks reward
      let marksReward = 0;
      let commissionAmount = 0;
      
      if (survey.boost_marks > 0) {
        const result = calculateMarksDistribution(survey.boost_marks, survey.goal_count);
        marksReward = result.marksPerHelper;
        commissionAmount = result.commission;
        
        console.log('Marks reward calculated:', { 
          boostMarks: survey.boost_marks, 
          goalCount: survey.goal_count, 
          marksPerHelper: marksReward, 
          commission: commissionAmount 
        });
      }
      
      console.log('Points calculation:', { 
        goal_count, 
        per, 
        todayPts, 
        cap, 
        canAward: todayPts < cap,
        marksReward 
      });
      
      if(todayPts < cap){
        awarded = Math.min(per, cap - todayPts);
        console.log('Awarding points:', { awarded, per, remaining: cap - todayPts });
        if(awarded > 0){
          // Insert into helper_points_transactions for tracking
          await client.query(
            'INSERT INTO helper_points_transactions(id,user_id,survey_id,type,points_awarded) VALUES($1,$2,$3,$4,$5)', 
            [uuidv4(), userId, surveyId, 'HELP', awarded]
          );
          
          // Insert into points table for total calculation
          await client.query(
            'INSERT INTO points(id,user_id,points,source,survey_id,description) VALUES($1,$2,$3,$4,$5,$6)',
            [uuidv4(), userId, awarded, 'help', surveyId, 'Survey help verification']
          );
          
          // Update users.points for legacy compatibility
          const u = await client.query(
            'UPDATE users SET points = points + $1 WHERE id=$2 RETURNING points',
            [awarded, userId]
          );
          const newPoints = u.rows[0].points;
          const newRank = computeRankLevel(newPoints);
          await client.query('UPDATE users SET rank_level=$1 WHERE id=$2',[newRank, userId]);
          console.log('Points awarded successfully:', { awarded, newPoints, newRank });
        } else {
          console.log('No points awarded - daily limit or 0 points');
        }
      } else {
        console.log('Daily points limit reached:', { todayPts, cap });
      }
      
      // Award marks if survey is boosted
      if (marksReward > 0) {
        try {
          // Check current marks before adding
          const currentMarksResult = await client.query(
            'SELECT marks FROM users WHERE id = $1',
            [userId]
          );
          const currentMarks = currentMarksResult.rows[0]?.marks || 0;
          
          // Calculate how many marks can be added (respecting 500 cap)
          const maxMarks = 500; // From WORLDCHAIN_CONFIG.MAX_MARKS_CAP
          const availableSpace = Math.max(0, maxMarks - currentMarks);
          const actualMarksToAward = Math.min(marksReward, availableSpace);
          
          if (actualMarksToAward > 0) {
            // Add marks to helper
            await client.query(
              'UPDATE users SET marks = marks + $1 WHERE id = $2',
              [actualMarksToAward, userId]
            );
            
            // Record mark transaction for helper
            await client.query(
              'INSERT INTO mark_transactions (user_id, survey_id, marks_amount, type) VALUES ($1, $2, $3, $4)',
              [userId, surveyId, actualMarksToAward, 'SURVEY_HELP']
            );
            
            if (actualMarksToAward < marksReward) {
              console.log(`Marks capped: awarded ${actualMarksToAward} instead of ${marksReward} (user at ${currentMarks}/${maxMarks})`);
            }
          } else {
            console.log(`No marks awarded: user already at cap (${currentMarks}/${maxMarks})`);
          }
          
          // Record commission transaction (platform keeps commission)
          if (commissionAmount > 0) {
            await client.query(
              'INSERT INTO mark_transactions (survey_id, marks_amount, type) VALUES ($1, $2, $3)',
              [surveyId, commissionAmount, 'COMMISSION']
            );
          }
          
          console.log('Marks awarded successfully:', {
            helperReward: marksReward,
            commission: commissionAmount
          });
        } catch (marksError) {
          console.error('Error awarding marks:', marksError);
          // Continue with survey processing even if marks fail
        }
      }
      
      // Create redirect token
      const crypto = await import('crypto');
      const redirectToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await client.query(
        'INSERT INTO survey_redirect_tokens(id, survey_id, helper_user_id, token, expires_at) VALUES($1,$2,$3,$4,$5)',
        [uuidv4(), surveyId, userId, redirectToken, expiresAt]
      );
      
      // Handle completion
      let completion = false;
      if(verified_count >= goal_count){
        await client.query("UPDATE surveys SET status='COMPLETED', completed_at=now() WHERE id=$1",[surveyId]);
        await client.query('UPDATE users SET active_survey_id=NULL WHERE id=$1',[survey.owner_user_id]);
        completion = true;
      }
      
      await client.query('COMMIT');
      
      const result = { 
        status:'counted', 
        progress: verified_count, 
        goal: goal_count, 
        awarded_points: awarded, 
        completed: completion,
        redirect_token: redirectToken
      };
      
      console.log('Verification result:', result);
      return result;
    });

    return NextResponse.json(result);

  } catch(error: any) {
    console.error('Database operation failed:', error);
    
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({error:'not found'},{status:404});
    }
    if (error.message === 'CLOSED') {
      return NextResponse.json({error:'closed'},{status:410});
    }
    if (error.message === 'OWNER_CANNOT_HELP') {
      return NextResponse.json({error:'owner cannot help own survey'},{status:403});
    }
    if (error.message === 'DUPLICATE') {
      return NextResponse.json({status:'duplicate'});
    }
    
    return NextResponse.json({error:'internal'},{status:500});
  }
}
