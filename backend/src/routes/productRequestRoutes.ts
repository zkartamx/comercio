import { Router } from 'express';
import { listProductRequests, createProductRequest, updateProductRequestStatus } from '../controllers/productRequestController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// GET /api/product-requests - Protegido para administradores
router.get('/', authenticate, authorize(['admin']), listProductRequests);

// POST /api/product-requests - Protegido para vendedores
router.post('/', authenticate, authorize(['seller']), createProductRequest);

// PUT /api/product-requests/:requestId/status - Protegido para administradores
router.put('/:requestId/status', authenticate, authorize(['admin']), updateProductRequestStatus);

// Aquí podrías añadir más rutas relacionadas con solicitudes de productos en el futuro

export default router;
