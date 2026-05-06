import express from 'express';
// importación del controlador de inscripciones
import * as inscripcionesController from '../controllers/inscripciones.controller.js';
// importación de middlewares de seguridad
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// ruta POST /api/inscripciones
// un asesorado puede inscribirse a una asesoría
router.post(
  '/', 
  requireAuth, 
  requireRole('asesorado'), 
  inscripcionesController.inscribir
);

// ruta GET /api/inscripciones/mis-asesorias
// el asesorado puede consultar sus asesorías inscritas
router.get(
  '/mis-asesorias', 
  requireAuth, 
  inscripcionesController.listarInscripciones
);

export default router;