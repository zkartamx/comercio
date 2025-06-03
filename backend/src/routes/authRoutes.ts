import { Router } from 'express';
import { register, login, registerSeller } from '../controllers/authController';
import { validateRegister, validateLogin, validateRegisterSeller } from '../middlewares/validate'; // validateRegisterSeller se creará

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/register-seller', validateRegisterSeller, registerSeller);

export default router;
