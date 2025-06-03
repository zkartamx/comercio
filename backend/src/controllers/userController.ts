import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const checkEmailExists = async (req: Request, res: Response) => {
  const { email } = req.query; // Tomaremos el email de los query params (ej. /api/users/check-email?email=test@example.com)

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required as a query parameter.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });
    if (user) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking email existence:', error);
    res.status(500).json({ error: 'Error checking email existence' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user.userId;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true, defaultShippingAddress: true, defaultBillingDetails: true },
    });
    if (user) {
      res.json({ ...user, role: user.role.toLowerCase() });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo perfil' });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({ 
      select: { id: true, email: true, name: true, username: true, role: true, createdAt: true }
    });
    const usersWithLowercaseRole = users.map(user => ({
      ...user,
      role: user.role.toLowerCase()
    }));
    res.json(usersWithLowercaseRole);
  } catch (error) {
    res.status(500).json({ error: 'Error listando usuarios' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user?.userId;
  const { name, defaultShippingAddress, defaultBillingDetails } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado.' });
  }

  // Validar que al menos un campo para actualizar esté presente
  if (name === undefined && defaultShippingAddress === undefined && defaultBillingDetails === undefined) {
    return res.status(400).json({ error: 'No se proporcionaron datos para actualizar.' });
  }

  const dataToUpdate: any = {};
  if (name !== undefined) dataToUpdate.name = name;
  if (defaultShippingAddress !== undefined) dataToUpdate.defaultShippingAddress = defaultShippingAddress; // Prisma espera JSON
  if (defaultBillingDetails !== undefined) dataToUpdate.defaultBillingDetails = defaultBillingDetails; // Prisma espera JSON

  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: dataToUpdate,
      // Excluir la contraseña de la respuesta
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        defaultShippingAddress: true,
        defaultBillingDetails: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(updatedUser);
  } catch (error) {
    console.error(`Error updating profile for user ${userId}:`, error);
    res.status(500).json({ error: 'Error al actualizar el perfil del usuario.' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const userIdToDeleteString = req.params.id;
  const userIdToDelete = parseInt(userIdToDeleteString, 10);

  if (isNaN(userIdToDelete)) {
    return res.status(400).json({ message: 'El ID del usuario proporcionado no es un número válido.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userIdToDelete },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Opcional: Impedir que un admin se elimine a sí mismo o a otros admins
    // if (user.role.toUpperCase() === 'ADMIN') {
    //   return res.status(403).json({ message: 'No se pueden eliminar administradores.' });
    // }

    await prisma.user.delete({
      where: { id: userIdToDelete },
    });

    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    // @ts-ignore
    if (error.code === 'P2003') { // Código de error de Prisma para restricción de clave externa
        return res.status(409).json({ message: 'No se puede eliminar el usuario porque tiene registros relacionados (por ejemplo, pedidos). Elimine primero esos registros.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al eliminar el usuario' });
  }
};
