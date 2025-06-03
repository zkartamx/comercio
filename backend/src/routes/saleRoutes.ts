import express from 'express';
import { createSaleRecord, getAllSales } from '../controllers/saleController';
import { authenticate, authorize } from '../middlewares/auth'; // Ajusta la ruta si es necesario

const router = express.Router();

// POST /api/sales - Crear un nuevo registro de venta
router.post('/', authenticate, authorize(['seller', 'admin']), createSaleRecord);

// GET /api/sales - Obtener todos los registros de venta (solo para admin)
router.get('/', authenticate, authorize(['admin']), getAllSales);

// TODO: Añadir otras rutas si son necesarias (ej. GET para listar ventas del vendedor)

export default router;
