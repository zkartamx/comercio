import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import { authenticate, authorize } from '../middlewares/auth';
import { validateProduct } from '../middlewares/validate';

const router = Router();

router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', authenticate, authorize(['admin']), validateProduct, createProduct);
router.put('/:id', authenticate, authorize(['admin']), validateProduct, updateProduct);
router.delete('/:id', authenticate, authorize(['admin']), deleteProduct);

export default router;
