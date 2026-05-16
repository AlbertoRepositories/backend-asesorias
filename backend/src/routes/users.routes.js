import express from 'express';
import { actualizarMateriasInteres, getMe, getById } from '../controllers/users.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// get /api/users/me — datos del usuario autenticado con materias pobladas
router.get('/me', requireAuth, getMe);

// patch /api/users/materias-interes — actualiza materias de interés (solo asesorado)
router.patch('/materias-interes', requireAuth, actualizarMateriasInteres);

// get /api/users/:id — perfil público de cualquier usuario con campos seguros
// sin auth para que el frontend pueda refrescar calificaciones sin bloquearse
// esta ruta va después de /me para que express no la confunda
router.get('/:id', getById);

export default router;