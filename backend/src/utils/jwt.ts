import jwt, { JwtPayload } from 'jsonwebtoken';
import type { StringValue } from 'ms';

interface TokenPayload extends JwtPayload {
  id: number;
  username: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET no está configurado');
  return secret;
}

export function generarToken(payload: { id: number; username: string }): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as StringValue;
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verificarToken(token: string): { id: number; username: string } {
  const decoded = jwt.verify(token, getSecret()) as TokenPayload;
  return { id: decoded.id, username: decoded.username };
}
