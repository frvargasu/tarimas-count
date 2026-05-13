import { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../utils/jwt';

export interface RequestConUsuario extends Request {
  usuario?: {
    id: number;
    username: string;
  };
}

export function authMiddleware(req: RequestConUsuario, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, error: 'Token no proporcionado' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verificarToken(token);
    req.usuario = payload;
    next();
  } catch {
    res.status(401).json({ ok: false, error: 'Token inválido o expirado' });
  }
}