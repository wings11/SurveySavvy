import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@lib/db';
import { verifyWorldIdPayload } from '@lib/worldid';
import { signUser } from '@lib/auth';

export async function POST(req:NextRequest){
  const body = await req.json();
  const { payload, action, signal, walletAddress } = body || {};
  if(!payload) return NextResponse.json({error:'missing payload'},{status:400});
  try { await verifyWorldIdPayload(payload, action || process.env.WORLDCOIN_LOGIN_ACTION || 'login', signal); } catch { return NextResponse.json({error:'verification_failed'},{status:400}); }
  const nullifier = (payload as any).nullifier_hash;
  const client = await pool.connect();
  try {
    let userId:string;
    const existing = await client.query('SELECT user_id FROM user_identities WHERE world_nullifier_hash=$1',[nullifier]);
    if(existing.rowCount===0){
      await client.query('BEGIN');
      const { v4: uuidv4 } = await import('uuid');
      userId = uuidv4();
      // Include wallet address when creating new user
      if (walletAddress && walletAddress.startsWith('0x')) {
        await client.query('INSERT INTO users(id, wallet_address) VALUES($1, $2)',[userId, walletAddress]);
      } else {
        await client.query('INSERT INTO users(id) VALUES($1)',[userId]);
      }
      await client.query("INSERT INTO user_identities(user_id, identity_type, world_nullifier_hash) VALUES($1,'WORLD_ID',$2)",[userId, nullifier]);
      await client.query('COMMIT');
    } else {
      userId = existing.rows[0].user_id;
      // Update wallet address for existing user if provided and not already set
      if (walletAddress && walletAddress.startsWith('0x')) {
        await client.query('UPDATE users SET wallet_address = $1 WHERE id = $2 AND (wallet_address IS NULL OR wallet_address = \'\')', [walletAddress, userId]);
      }
    }
    const token = signUser(userId);
    return NextResponse.json({ token, userId });
  } catch(e){ return NextResponse.json({error:'internal'},{status:500}); } finally { client.release(); }
}
