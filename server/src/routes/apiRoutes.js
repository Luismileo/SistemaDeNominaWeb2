import { Router } from 'express';
import { loginUser, checkSession, logoutUser } from '../controllers/authController.js';
import { dispatchToProcess } from '../controllers/processController.js';

const router = Router();

// Endpoints de autenticación
router.post('/login', loginUser);
router.get('/session', checkSession);
router.post('/logout', logoutUser);

// Despachador dinámico centralizado
router.post('/toProcess', dispatchToProcess);

export default router;
