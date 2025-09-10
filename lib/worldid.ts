import { z } from 'zod';
import { verifyCloudProof, ISuccessResult } from '@worldcoin/minikit-js';

const proofSchema = z.object({
  merkle_root: z.string(),
  nullifier_hash: z.string(),
  proof: z.string(),
  credential_type: z.string().optional(),
  verification_level: z.string().optional(),
  signal: z.string().optional(),
});

export async function verifyWorldIdPayload(payload:ISuccessResult, action:string, signal?:string){
  console.log('World ID verification attempt:', { action, signal, payload });
  
  const app_id = process.env.APP_ID as `app_${string}`;
  if (!app_id) {
    console.error('APP_ID environment variable not set');
    throw new Error('app_id_missing');
  }
  
  const parsed = proofSchema.safeParse(payload);
  if(!parsed.success) {
    console.error('Proof schema validation failed:', parsed.error);
    throw new Error('invalid_proof');
  }
  
  try {
    const res = await verifyCloudProof(payload, app_id, action, signal);
    console.log('Cloud proof verification result:', res);
    if(!res.success) throw new Error('verification_failed');
    return res;
  } catch (error) {
    console.error('Cloud proof verification error:', error);
    throw error;
  }
}
