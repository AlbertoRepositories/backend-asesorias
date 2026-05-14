import express from 'express';
import * as asesoriasController from '../controllers/asesorias.controller.js';
import { validateCreateAsesoria, validateEditAsesoria, handleValidationErrors } from '../utils/validators.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Crear asesoría (requiere autenticación y validaciones)
router.post(
  '/',
  requireAuth,
  validateCreateAsesoria,
  handleValidationErrors,
  asesoriasController.crearAsesoria
);

// Editar asesoría (requiere autenticación y validaciones)
router.put(
  '/:id',
  requireAuth,
  validateEditAsesoria,
  handleValidationErrors,
  asesoriasController.editarAsesoria
);

// Obtener todas las asesorías
router.get('/', asesoriasController.getAsesorias);

// Obtener asesorías de un asesor específico
router.get('/asesor/:id', asesoriasController.getAsesoriasPorAsesor);

// Obtener detalles de una asesoría específica
router.get('/:id', asesoriasController.getAsesoriaById);

// Cancelar asesoría
router.delete('/:id', requireAuth, asesoriasController.cancelarAsesoria);

export default router;