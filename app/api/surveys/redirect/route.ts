import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    // Set a timeout for this connection
    await client.query('SET statement_timeout = 10000'); // 10 seconds
    
    // Get the redirect token and mark it as used
    const result = await client.query(`
      SELECT srt.survey_id, s.target_url 
      FROM survey_redirect_tokens srt
      JOIN surveys s ON s.id = srt.survey_id
      WHERE srt.token = $1 
        AND srt.used = false 
        AND srt.expires_at > NOW()
    `, [token]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    const { target_url } = result.rows[0];

    // Mark token as used
    await client.query(
      'UPDATE survey_redirect_tokens SET used = true WHERE token = $1',
      [token]
    );

    // Redirect to the survey URL
    return NextResponse.redirect(target_url);
  } catch (error) {
    console.error('Redirect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    try {
      client.release();
    } catch (releaseError) {
      console.error('Connection release failed:', releaseError);
    }
  }
}
