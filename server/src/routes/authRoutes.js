import { Router } from 'express';
import { loginUser, checkSession, logoutUser } from '../controllers/authController.js';

const router = Router();

// Authentication endpoints / Endpoints de autenticación
router.post('/login', loginUser);
router.get('/session', checkSession);
router.post('/logout', logoutUser);

export default router;