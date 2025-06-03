import { Router } from 'express';
import { getProfile, listUsers, deleteUser, updateProfile, checkEmailExists } from '../controllers/userController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile); // Ruta para actualizar el perfil del usuario autenticado
router.get('/', authenticate, authorize(['admin']), listUsers);
router.delete('/:id', authenticate, authorize(['admin']), deleteUser);
router.get('/check-email', checkEmailExists); // No auth needed, for pre-registration check

export default router;
