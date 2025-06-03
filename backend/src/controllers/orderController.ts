import { Request, Response } from 'express';
import prisma from '../prisma';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client'; // Asegúrate que la ruta a tu cliente Prisma sea correcta
import bcrypt from 'bcryptjs';

// Listar todas las órdenes (ejemplo, puedes expandirlo)
export const listOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true, // Opcional, si quieres info del usuario
        items: {   // Incluir los items del pedido
          include: {
            product: true // Opcional, si quieres info del producto en cada item
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Error fetching orders' });
  }
};

// Obtener una orden específica por ID (ejemplo, puedes expandirlo)
export const getOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    res.status(500).json({ error: 'Error fetching order' });
  }
};

// Crear una nueva orden
export const createOrder = async (req: Request, res: Response) => {
  const {
    userId, // Opcional: ID del usuario si está logueado
    customerName,
    customerEmail,
    items, // Array de OrderItemInput
    totalAmount,
    shippingAddress, // Objeto JSON
    billingRequested,
    billingDetails, // Objeto JSON, opcional
    password, // Optional: password for account creation during guest checkout
  } = req.body;

  // Validación básica (puedes expandirla mucho más)
  if (!customerName || !customerEmail || !items || items.length === 0 || !totalAmount || !shippingAddress) {
    return res.status(400).json({ error: 'Missing required fields for order creation.' });
  }

  if (!Array.isArray(items) || items.some(item => !item.productId || !item.quantity || !item.priceAtOrder || !item.productName)) {
    return res.status(400).json({ error: 'Invalid items data. Each item must have productId, productName, quantity, and priceAtOrder.' });
  }

  try {
    let effectiveUserId = userId ? Number(userId) : undefined;

    // Handle guest account creation if password is provided
    if (!effectiveUserId && password && customerEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: customerEmail },
      });

      if (existingUser) {
        return res.status(409).json({ 
          error: 'An account with this email already exists. Please login to place your order or use a different email address.' 
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          email: customerEmail,
          password: hashedPassword,
          name: customerName, // Use customerName for the user's name
          role: Role.customer, // Default role, using Enum
        },
      });
      effectiveUserId = newUser.id;
      // newUser object created successfully
    }

    const orderData: any = {
      customerName,
      customerEmail,
      totalAmount: parseFloat(totalAmount),
      shippingAddress, // Prisma espera un Json, así que el objeto directo funciona
      billingRequested: Boolean(billingRequested),
      paymentStatus: 'UNPAID', // Estado de pago inicial
      status: 'PENDING_CONFIRMATION', // Estado del pedido inicial
      items: {
        create: items.map((item: any) => ({
          productId: Number(item.productId),
          productName: String(item.productName),
          quantity: Number(item.quantity),
          priceAtOrder: parseFloat(item.priceAtOrder),
        })),
      },
    };

    if (effectiveUserId) {
      orderData.userId = effectiveUserId;
    }
    
    if (billingRequested && billingDetails) {
      orderData.billingDetails = billingDetails; // Prisma espera un Json
    } else if (billingRequested && !billingDetails) {
      // Opcional: puedes decidir si esto es un error o si permites billingRequested sin billingDetails
      // return res.status(400).json({ error: 'Billing details are required when billing is requested.' });
      orderData.billingDetails = {}; // O un JSON vacío por defecto si es permitido
    }


    const newOrder = await prisma.order.create({
      data: orderData,
      include: {
        items: true, // Incluir los items creados en la respuesta
        user: true,  // Incluir el usuario si está asociado
      },
    });

    // Si se creó un nuevo usuario, generar token y preparar datos del usuario para la respuesta
    if (password && !userId && effectiveUserId) {
      // Update the newly created user with default addresses from the order
      try {
        await prisma.user.update({
          where: { id: effectiveUserId }, // effectiveUserId is the ID of the newly created user
          data: {
            defaultShippingAddress: shippingAddress, // from req.body
            defaultBillingDetails: billingDetails || null, // If no billingDetails, set to null
          },
        });
      } catch (userUpdateError) {
        console.error(`Error al actualizar las direcciones por defecto del usuario ${effectiveUserId}:`, userUpdateError);
        // Log the error and continue; order and user creation were successful.
      }

      const userForResponse = await prisma.user.findUnique({ where: { id: effectiveUserId } });
      if (userForResponse) {
        const token = jwt.sign(
          { userId: userForResponse.id, email: userForResponse.email, role: userForResponse.role },
          process.env.JWT_SECRET || 'your_default_secret_key_here',
          { expiresIn: '1h' }
        );
        // Devolver la orden, el usuario y el token
        return res.status(201).json({
          order: newOrder,
          user: {
            id: userForResponse.id,
            email: userForResponse.email,
            name: userForResponse.name,
            displayName: userForResponse.name, // Asegurar displayName
            role: userForResponse.role,
            defaultShippingAddress: userForResponse.defaultShippingAddress, // Add this
            defaultBillingDetails: userForResponse.defaultBillingDetails   // Add this
          },
          token
        });
      }
    }

    // Si no se creó un nuevo usuario (o falló la recuperación para el token), devolver solo la orden
    res.status(201).json({ order: newOrder });

    // Opcional: Aquí podrías querer reducir el stock de los productos
    // Esto debería hacerse idealmente en una transacción para asegurar consistencia
    // await prisma.$transaction(async (tx) => {
    //   for (const item of items) {
    //     await tx.product.update({
    //       where: { id: Number(item.productId) },
    //       data: { stock: { decrement: Number(item.quantity) } },
    //     });
    //   }
    //   // Si algo falla aquí, la transacción hará rollback de la creación del pedido también (si se incluye arriba)
    // });


    // Después de crear la orden, actualizar las direcciones por defecto del usuario si existe userId
    if (newOrder && newOrder.userId && req.body.shippingAddress) { // Asumimos que billingDetails puede ser opcional o parte de shippingAddress si no es requerido explícitamente
      try {
        const updateData: any = {
          defaultShippingAddress: req.body.shippingAddress,
        };
        if (req.body.billingDetails) { // Solo añadir billingDetails si está presente
          updateData.defaultBillingDetails = req.body.billingDetails;
        }

        await prisma.user.update({
          where: { id: newOrder.userId },
          data: updateData,
        });
        console.log(`Direcciones por defecto actualizadas para el usuario ${newOrder.userId}`);
      } catch (userUpdateError) {
        console.error(`Error al actualizar las direcciones por defecto del usuario ${newOrder.userId}:`, userUpdateError);
        // No se devuelve error al cliente por esto, el pedido ya se creó.
      }
    }

    res.status(201).json(newOrder);
  } catch (error: any) {
    console.error('Error creating order:', error);
    if (error.code === 'P2002') { // Código de error de Prisma para violación de restricción única
      // Esto podría pasar si, por ejemplo, intentas usar un ID de pedido que ya existe (no aplica aquí con autoincrement)
      // o si una relación falla de alguna manera específica.
      return res.status(409).json({ error: 'Failed to create order due to a conflict. Please check data.', details: error.meta });
    }
    if (error.code === 'P2025') { // Error de Prisma cuando un registro relacionado no se encuentra
        return res.status(400).json({ error: 'Failed to create order. A related record (e.g., product or user) was not found.', details: error.meta });
    }
    res.status(500).json({ error: 'Internal server error while creating order.' });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user?.userId;

  if (!userId) {
    // Esto no debería pasar si el middleware authenticate funciona correctamente
    return res.status(401).json({ error: 'Usuario no autenticado correctamente.' });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: Number(userId) },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(orders);
  } catch (error) {
    console.error(`Error fetching orders for user ${userId}:`, error);
    res.status(500).json({ error: 'Error fetching user orders' });
  }
};

// Actualizar una orden (ejemplo básico, principalmente para status)
export const updateOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body; // Solo permite actualizar estos campos por ahora

  try {
    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No update data provided." });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        items: true,
        user: true,
      }
    });
    res.json(updatedOrder);
  } catch (error: any) {
    console.error(`Error updating order ${id}:`, error);
    if (error.code === 'P2025') { // Record to update not found
        return res.status(404).json({ error: 'Order not found for updating.' });
    }
    res.status(500).json({ error: 'Error updating order' });
  }
};

// Eliminar una orden
export const deleteOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Usar una transacción para asegurar que ambas operaciones (eliminar items y eliminar orden)
    // se completen exitosamente o ninguna se aplique.
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar OrderItems asociados al pedido
      await tx.orderItem.deleteMany({
        where: { orderId: parseInt(id) },
      });

      // 2. Eliminar el Pedido
      // delete() lanzará un error P2025 si el pedido no se encuentra,
      // que será capturado por el bloque catch.
      await tx.order.delete({
        where: { id: parseInt(id) },
      });
    });

    res.status(200).json({ message: `Order with ID ${id} and its items deleted successfully` });
  } catch (error: any) {
    if (error.code === 'P2025') { // Código de error de Prisma para "Registro no encontrado"
      return res.status(404).json({ message: `Order with ID ${id} not found` });
    }
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
};
