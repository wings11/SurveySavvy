import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@lib/db';
import { verifyToken } from '@lib/auth';

export async function DELETE(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return NextResponse.json({ error: 'missing auth' }, { status: 401 });
  
  let userId: string;
  try {
    userId = verifyToken(auth.replace('Bearer ', '')).userId;
  } catch {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Get user's active survey
    const userRes = await client.query(
      'SELECT active_survey_id FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'user not found' }, { status: 404 });
    }

    const activeSurveyId = userRes.rows[0].active_survey_id;
    if (!activeSurveyId) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'no active survey' }, { status: 400 });
    }

    // Check if survey has any verifications (responses)
    const verificationRes = await client.query(
      'SELECT COUNT(*) as count FROM survey_verifications WHERE survey_id = $1',
      [activeSurveyId]
    );

    const verificationCount = parseInt(verificationRes.rows[0].count);

    // If survey has responses, mark it as cancelled instead of deleting
    if (verificationCount > 0) {
      await client.query(
        "UPDATE surveys SET status = 'CANCELLED', completed_at = now() WHERE id = $1",
        [activeSurveyId]
      );
    } else {
      // If no responses, we can safely delete the survey and related data
      await client.query(
        'DELETE FROM survey_redirect_tokens WHERE survey_id = $1',
        [activeSurveyId]
      );
      await client.query(
        'DELETE FROM surveys WHERE id = $1',
        [activeSurveyId]
      );
    }

    // Clear user's active survey
    await client.query(
      'UPDATE users SET active_survey_id = NULL WHERE id = $1',
      [userId]
    );

    await client.query('COMMIT');

    return NextResponse.json({ 
      success: true, 
      message: verificationCount > 0 
        ? 'Survey cancelled successfully (had responses)' 
        : 'Survey deleted successfully (no responses)',
      had_responses: verificationCount > 0
    });

  } catch (error) {
    console.error('Delete survey error:', error);
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Connection release failed:', releaseError);
      }
    }
  }
}
