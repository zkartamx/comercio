import { Request, Response } from 'express';
import { PrismaClient, RequestStatus } from '@prisma/client'; // Import RequestStatus

const prisma = new PrismaClient();

// Interfaz para el cuerpo de la solicitud de creación
interface CreateProductRequestPayload {
  productId: number;
  quantityRequested: number;
  notes?: string;
}

export const createProductRequest = async (req: Request, res: Response) => {
  const { productId, quantityRequested, notes } = req.body as CreateProductRequestPayload;
  // Asumiendo que el middleware de autenticación añade 'user' al objeto 'req'
  // y que 'user' tiene una propiedad 'userId'
  const sellerId = (req as any).user?.userId;

  if (!sellerId) {
    return res.status(403).json({ error: 'Usuario no autenticado o no es un vendedor.' });
  }

  if (!productId || !quantityRequested) {
    return res.status(400).json({ error: 'productId y quantityRequested son obligatorios.' });
  }

  if (typeof quantityRequested !== 'number' || quantityRequested <= 0) {
    return res.status(400).json({ error: 'quantityRequested debe ser un número positivo.' });
  }
  
  try {
    // Verificar que el producto exista
    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      return res.status(404).json({ error: `Producto con ID ${productId} no encontrado.` });
    }

    const newProductRequest = await prisma.productRequest.create({
      data: {
        productId: Number(productId),
        requestedById: Number(sellerId), // Set foreign key directly
        quantityRequested: Number(quantityRequested),
        notes: notes || null,
        status: RequestStatus.PENDING // Estado por defecto
      },
      include: { // Incluir detalles del producto y vendedor en la respuesta si se desea
        product: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
      }
    });

    res.status(201).json(newProductRequest);
  } catch (error) {
    console.error('Error al crear la solicitud de producto:', error);
    if (error instanceof Error && error.message.includes('foreign key constraint fails')) {
        return res.status(400).json({ error: 'Error de referencia: El producto o vendedor especificado no existe.' });
    }
    res.status(500).json({ error: 'Error interno del servidor al crear la solicitud de producto.' });
  }
};

// Placeholder para la lógica de listar solicitudes de productos
export const listProductRequests = async (_req: Request, res: Response) => {
  try {
    // TODO: Implementar la lógica para obtener solicitudes de productos de la base de datos
    // Ejemplo: const productRequests = await prisma.productRequest.findMany({ include: { /* relaciones necesarias */ } });
    // Por ahora, solo para administradores, podrías querer filtrar por vendedor para los vendedores
     const productRequests = await prisma.productRequest.findMany({
      include: {
        product: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc'}
    });
    res.json(productRequests);
  } catch (error) {
    console.error('Error listing product requests:', error);
    res.status(500).json({ error: 'Error al listar las solicitudes de productos' });
  }
};

export const updateProductRequestStatus = async (req: Request, res: Response) => {
  console.log('[updateProductRequestStatus] Received body:', req.body);
  const { requestId } = req.params;
  const { status: receivedStatus, adminNotes } = req.body as { status: string; adminNotes?: string }; // Treat status as string initially
  console.log('[updateProductRequestStatus] Extracted status:', receivedStatus, 'adminNotes:', adminNotes);

  if (!receivedStatus) {
    return res.status(400).json({ error: 'El nuevo estado (status) es obligatorio.' });
  }

  const upperStatus = receivedStatus.toUpperCase(); // Convert to uppercase

  // Validar que el status (en mayúsculas) sea uno de los valores permitidos por el enum RequestStatus
  if (!Object.values(RequestStatus).includes(upperStatus as RequestStatus)) {
    console.error(`[Validation Error] Status to validate: '${upperStatus}' (original: '${receivedStatus}'), RequestStatus Enum keys: ${Object.keys(RequestStatus)}, RequestStatus Enum values: ${Object.values(RequestStatus)}`);
    return res.status(400).json({ error: `Estado '${receivedStatus}' no válido.` });
  }

  try {
    console.log(`[Prisma Update] Attempting to update request ID: ${requestId} to status: ${upperStatus} with adminNotes: ${adminNotes}`);
    const updatedRequest = await prisma.productRequest.update({
      where: { id: parseInt(requestId, 10) },
      data: { 
        status: upperStatus as RequestStatus, // Use the uppercase version
        adminNotes: adminNotes || null,
      },
      include: {
        product: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Esta comprobación puede ser redundante si Prisma tira error en caso de no encontrarlo para update
    // pero la dejamos por si acaso o si la lógica de negocio requiere una doble verificación.
    if (!updatedRequest) {
      console.error(`[Prisma Update] No request found after attempting update for ID: ${requestId}`);
      return res.status(404).json({ error: 'Solicitud de producto no encontrada tras la actualización.' });
    } // Cerrar el if

    console.log(`[Prisma Update] Successfully updated request ID: ${requestId}`, updatedRequest);
    return res.status(200).json(updatedRequest);

  } catch (error: any) { // Usamos 'any' para poder inspeccionar 'code' de Prisma
    console.error('[updateProductRequestStatus] Error during Prisma update or processing:', error);
    // Errores comunes de Prisma:
    // P2025: Record to update not found.
    // P2002: Unique constraint failed
    // P2003: Foreign key constraint failed
    if (error.code === 'P2025') {
      return res.status(404).json({ error: `No se encontró el registro de solicitud de producto con ID ${requestId} para actualizar.`, details: error.message });
    }
    // Aquí puedes añadir más códigos de error de Prisma si son relevantes

    // Error genérico
    return res.status(500).json({ error: 'Error interno del servidor al actualizar la solicitud.', details: error.message || String(error) });
  }
};
