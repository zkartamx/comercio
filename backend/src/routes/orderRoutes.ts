import { Router } from 'express';
import {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  getMyOrders, // Importar la nueva función
} from '../controllers/orderController';
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, authorize(['admin']), listOrders);
router.get('/my', authenticate, getMyOrders); // Nueva ruta para los pedidos del usuario
router.get('/:id', authenticate, getOrder); // Esta ruta debe ir DESPUÉS de /my
router.post('/', optionalAuthenticate, createOrder);
router.put('/:id', authenticate, authorize(['admin']), updateOrder);
router.delete('/:id', authenticate, authorize(['admin']), deleteOrder);

export default router;
