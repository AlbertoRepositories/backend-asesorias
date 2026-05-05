import express from 'express';

// Importa controllers
import { register, login } from '../controllers/auth.controller.js';

// Crea router
const router = express.Router();

// Endpoint POST /api/auth/register
router.post('/register', register);

// Endpoint POST /api/auth/login
router.post('/login', login);

// Exporta router
export default router;