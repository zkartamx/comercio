import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload; // o el tipo específico de tu payload de usuario
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const optionalAuthenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.user = payload; // Adjunta el usuario si el token es válido
    } catch (error) {
      // Token inválido. Podríamos registrar esto, pero no bloqueamos la solicitud.
      // req.user permanecerá indefinido.
      console.warn('Optional auth: Invalid token received, proceeding as unauthenticated.');
    }
  }
  // Si no hay authHeader, o si el token fue inválido, req.user es undefined.
  // Siempre llamamos a next() para continuar.
  next();
};

export const authorize = (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user || !roles.includes(user.role)) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  next();
};
