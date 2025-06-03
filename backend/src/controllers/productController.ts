import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const listProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error listando productos' });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({ where: { id: Number(id) } });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo producto' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, description, price, stock, imageUrl } = req.body;
  try {
    const productData: Prisma.ProductCreateInput = { name, description, price, stock };
    if (imageUrl !== undefined) {
      productData.imageUrl = imageUrl.trim() || null;
    }
    const product = await prisma.product.create({ data: productData });
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Error creando producto' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, price, stock, imageUrl } = req.body;
  try {
    const productId = Number(id);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID de producto inválido.' });
    }

    const dataToUpdate: Prisma.ProductUpdateInput = { name, description, price, stock };
    if (imageUrl !== undefined) {
      dataToUpdate.imageUrl = imageUrl.trim() || null;
    }
    
    const product = await prisma.product.update({
      where: { id: productId },
      data: dataToUpdate,
    });
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Error actualizando producto' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const productId = Number(id);

  if (isNaN(productId)) {
    return res.status(400).json({ error: 'ID de producto inválido.' });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    await prisma.product.delete({ where: { id: productId } });
    res.status(204).send(); // Éxito, sin contenido
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Código P2003: Violación de restricción de clave externa
      if (error.code === 'P2003') {
        return res.status(409).json({ 
          error: 'No se puede eliminar el producto porque está asociado a uno o más pedidos existentes.' 
        });
      }
    }
    // Loguear el error para depuración en el servidor
    console.error('Error eliminando producto:', error);
    res.status(500).json({ error: 'Error interno del servidor al intentar eliminar el producto.' });
  }
};
