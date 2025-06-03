import { Request, Response } from 'express';
import prisma from '../prisma';
import { Prisma, Role } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const register = async (req: Request, res: Response) => {
  // El rol se ignora del body y se asigna por defecto 'CUSTOMER'
  const { email, password, name } = req.body;
  const defaultRole = Role.customer; // Rol por defecto para nuevos registros

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email ya registrado' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { 
        email, 
        password: hashedPassword, 
        name, 
        role: defaultRole // Asignar rol por defecto
      },
    });
    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role }, // Asegurar que el rol esté en minúsculas en el token
      process.env.JWT_SECRET || 'your_default_secret_key_here',
      { expiresIn: '1h' } // O el tiempo de expiración que prefieras
    );

    res.status(201).json({
      message: 'Cliente creado exitosamente',
      user: {
        id: user.id,
        // username: user.username, // username no se está pidiendo en el registro de cliente
        email: user.email,
        name: user.name,
        displayName: user.name,
        role: user.role // Role enum is already lowercase
      },
      token // Incluir el token en la respuesta
    });
  } catch (error: any) {
    console.error('Error en el registro de cliente:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { // Código de error de restricción única
        const target = error.meta?.target as string[];
        return res.status(400).json({ error: `El valor para el campo '${target?.join(', ')}' ya existe y debe ser único.` });
      }
    }
    res.status(500).json({ error: 'Error interno del servidor al registrar el cliente' });
  }
};

export const registerSeller = async (req: Request, res: Response) => {
  console.log('registerSeller req.body:', req.body);
  const { username, password, name, email } = req.body;
  const sellerRole = "seller";

  // Validación básica de campos (se puede expandir o mover a middleware)
  if (!username || !password || !name || !email) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios: username, password, name, email' });
  }

  try {
    // Verificar si el email ya existe, ya que es único en la tabla User
    const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'Este correo electrónico ya está registrado.' });
    }

    // Opcional: Verificar si el username ya existe si también debe ser único para vendedores
    // const existingUserByUsername = await prisma.user.findUnique({ where: { username } });
    // if (existingUserByUsername) {
    //   return res.status(400).json({ error: 'Este nombre de usuario ya está en uso.' });
    // }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: sellerRole,
        username: username,
      },
    });

    // No enviar la contraseña hasheada en la respuesta
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({ message: 'Registro exitoso', user: userWithoutPassword });
  } catch (error: any) {
    console.error('Error en el registro de vendedor:', error);
    // Comprobar si el error es de Prisma por violación de unicidad (ej. si username también es unique)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // El campo que causa el error está en error.meta.target
        // Ejemplo: ['username'] o ['email']
        const target = error.meta?.target as string[];
        if (target && target.includes('username')) {
          return res.status(400).json({ error: 'Este nombre de usuario ya está en uso.' });
        }
        // El chequeo de email ya se hizo, pero por si acaso
        if (target && target.includes('email')) {
          return res.status(400).json({ error: 'Este correo electrónico ya está registrado.' });
        }
        return res.status(400).json({ error: `El valor para el campo '${target?.join(', ')}' ya existe y debe ser único.` });
      }
    }
    res.status(500).json({ error: 'Error interno del servidor al registrar el vendedor' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const userRoleLowercase = user.role.toLowerCase(); // Convertir rol a minúsculas
    const token = jwt.sign({ userId: user.id, role: userRoleLowercase }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, displayName: user.name, role: userRoleLowercase } });
  } catch (error) {
    res.status(500).json({ error: 'Error en el login' });
  }
};
