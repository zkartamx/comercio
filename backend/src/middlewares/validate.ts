import { Request, Response, NextFunction } from 'express';

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name } = req.body; // 'role' ya no se espera del cliente
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Todos los campos son requeridos: email, password, name' });
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  // Aquí podrías añadir validación para 'name' si es necesario (ej. longitud mínima)
  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }
  next();
};

export const validateProduct = (req: Request, res: Response, next: NextFunction) => {
  const { name, price, stock } = req.body;
  if (!name || typeof price !== 'number' || typeof stock !== 'number') {
    return res.status(400).json({ error: 'Nombre, precio y stock son requeridos y deben ser válidos' });
  }
  next();
};

export const validateRegisterSeller = (req: Request, res: Response, next: NextFunction) => {
  const { username, email, password, name } = req.body;
  if (!username || !email || !password || !name) {
    return res.status(400).json({ error: 'Todos los campos son requeridos: username, email, password, name' });
  }
  if (typeof username !== 'string' || username.length < 3) {
    return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' });
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  if (typeof name !== 'string' || name.length < 2) {
    return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
  }
  next();
};
