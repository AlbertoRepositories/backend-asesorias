import express from 'express';
import * as notificacionesController from '../controllers/notificaciones.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ruta GET /api/notificaciones
// lista todas las notificaciones del usuario
router.get(
  '/', 
  requireAuth, 
  notificacionesController.obtenerNotificaciones
);

// ruta PATCH /api/notificaciones/:id/leida
// cambia el estado de una notificación a "leída". Patch porque solo se actualiza un campo (leida)
router.patch(
  '/:id/leida', 
  requireAuth, 
  notificacionesController.marcarNotificacionLeida
);

export default router;