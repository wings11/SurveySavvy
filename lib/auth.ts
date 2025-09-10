import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if(!JWT_SECRET) throw new Error('JWT_SECRET missing');

export function signUser(userId:string){
  return jwt.sign({ userId, auth:'WORLD_ID' }, JWT_SECRET as string, { expiresIn:'7d' });
}

export function verifyToken(token:string){
  return jwt.verify(token, JWT_SECRET as string) as { userId:string, auth:string };
}
