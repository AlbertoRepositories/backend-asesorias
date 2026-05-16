import express from 'express';
import { actualizarMateriasInteres, getMe, getById, seguirAsesor, dejarDeSeguirAsesor, getAsesoresSeguidos } from '../controllers/users.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/users/me — datos del usuario autenticado con materias pobladas
router.get('/me', requireAuth, getMe);

// PATCH /api/users/materias-interes — actualiza materias de interés (solo asesorado)
router.patch('/materias-interes', requireAuth, actualizarMateriasInteres);

// GET /api/users/asesores-seguidos — obtiene asesores que sigue el asesorado
router.get('/asesores-seguidos', requireAuth, getAsesoresSeguidos);

// POST /api/users/seguir/:asesorId — el asesorado sigue a un asesor
router.post('/seguir/:asesorId', requireAuth, seguirAsesor);

// DELETE /api/users/seguir/:asesorId — el asesorado deja de seguir a un asesor
router.delete('/seguir/:asesorId', requireAuth, dejarDeSeguirAsesor);

// GET /api/users/:id — perfil público de cualquier usuario con campos seguros
// sin auth para que el frontend pueda refrescar calificaciones sin bloquearse
// esta ruta va después de /me para que express no la confunda
router.get('/:id', getById);

export default router;