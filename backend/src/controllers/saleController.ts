import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middlewares/auth'; // Asumiendo que tienes este tipo


export enum SaleSource {
  ONLINE = 'Online',
  SELLER = 'Seller Direct'
}

interface SaleItemInput {
  productId: number;
  quantity: number;
  unitPrice: number; // Changed from price to unitPrice
}

interface SaleData {
  items: SaleItemInput[];
  totalAmount: number;
  notes?: string; // Notas opcionales para la venta
  //customerId?: string; // Opcional, si las ventas pueden estar asociadas a clientes
}

export const createSaleRecord = async (req: AuthenticatedRequest, res: Response) => {
  console.log('Received sale request body:', JSON.stringify(req.body, null, 2)); // Log para depuración
  const { items, totalAmount, notes } = req.body as SaleData;
  const sellerId = req.user?.userId;

  // Validación de items y precios
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'La lista de artículos no puede estar vacía.' });
  }

  for (const item of items) {
    if (typeof item.productId !== 'number' || typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
      console.error('Invalid item structure or type:', item);
      return res.status(400).json({ 
        error: 'Cada artículo debe tener productId (número), quantity (número) y unitPrice (número).',
        invalidItem: item 
      });
    }
    if (item.unitPrice <= 0) {
      console.error('Invalid item price:', item);
      return res.status(400).json({ 
        error: 'El precio de cada artículo debe ser un número positivo.',
        invalidItem: item 
      });
    }
  }
 // Asumiendo que req.user está poblado por authMiddleware

  if (!sellerId) {
    return res.status(403).json({ error: 'Usuario no autenticado correctamente.' });
  }

  if (!items || items.length === 0 || !totalAmount) {
    return res.status(400).json({ error: 'Faltan datos de la venta (items, totalAmount).' });
  }

  try {
    // Aquí iría la lógica para validar productos, stock, etc.
    // Por ahora, creamos un registro simple de la venta

    const sale = await prisma.sale.create({
      data: {
        sellerId: sellerId,
        totalAmount: totalAmount,
        notes: notes, // Añadir notas aquí
        items: {
          create: items.map((item: SaleItemInput) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        items: true, // Incluir los items de la venta en la respuesta
      },
    });

    res.status(201).json(sale);
  } catch (error: any) {
    console.error('Error al registrar la venta:', error);
    // Considerar errores específicos, ej. si un producto no existe o no hay stock
    if (error.code === 'P2003' && error.meta?.field_name?.includes('productId')) {
        return res.status(400).json({ error: 'Uno o más productos en la venta no existen.' });
    }
    res.status(500).json({ error: 'Error interno del servidor al registrar la venta.' });
  }
};

export const getAllSales = async (req: AuthenticatedRequest, res: Response) => {
  // Solo admin puede acceder, ya validado por middleware authorize(['admin'])
  try {
    const sales = await prisma.sale.findMany({
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true, // Precio actual del producto, para referencia
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Mostrar las ventas más recientes primero
      },
    });
        // Define types for the data structure returned by Prisma
    type PrismaSaleWithDetails = Prisma.SaleGetPayload<{
      include: {
        seller: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
        items: {
          include: {
            product: {
              select: {
                id: true;
                name: true;
                price: true;
              };
            };
          };
        };
      };
    }>;

    type PrismaSaleItemWithProduct = Prisma.SaleItemGetPayload<{
      include: {
        product: {
          select: {
            id: true;
            name: true;
            price: true;
          };
        };
      };
    }>;

    const transformedSales = sales.map((sale: PrismaSaleWithDetails) => ({
      id: String(sale.id),
      sellerId: sale.seller ? String(sale.seller.id) : undefined,
      saleDate: sale.createdAt.toISOString(),
      totalAmount: sale.totalAmount,
      notes: sale.notes || undefined, // Leer 'notes' directamente del objeto sale 
      source: SaleSource.SELLER, 
      items: sale.items.map((item: PrismaSaleItemWithProduct) => ({
        productId: item.product ? String(item.product.id) : undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        product: item.product ? {
          id: String(item.product.id),
          name: item.product.name,
        } : undefined,
      })),
    }));
    res.status(200).json(transformedSales);
  } catch (error) {
    console.error('Error al obtener todas las ventas:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener las ventas.' });
  }
};
