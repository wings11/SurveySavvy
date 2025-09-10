import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { signUser } from '@lib/auth';
import { pool } from '@lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.name) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Use the World ID sub (nullifier) as userId
    const worldSub = session.user.name; // NextAuth puts the sub in the name field
    
    const client = await pool.connect();
    try {
      // Check if user exists by World ID nullifier
      let userId: string;
      const existing = await client.query('SELECT user_id FROM user_identities WHERE world_nullifier_hash=$1', [worldSub]);
      
      if (existing.rowCount === 0) {
        // Create new user
        await client.query('BEGIN');
        const { v4: uuidv4 } = await import('uuid');
        userId = uuidv4();
        await client.query('INSERT INTO users(id) VALUES($1)', [userId]);
        await client.query("INSERT INTO user_identities(user_id, identity_type, world_nullifier_hash) VALUES($1,'WORLD_ID',$2)", [userId, worldSub]);
        await client.query('COMMIT');
      } else {
        userId = existing.rows[0].user_id;
      }
      
      const token = signUser(userId);
      return NextResponse.json({ token, userId });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Auth bridge error:', e);
    return NextResponse.json({ error: 'Failed to bridge auth' }, { status: 500 });
  }
}
