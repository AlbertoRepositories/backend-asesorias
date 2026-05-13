import express from 'express';
import * as evaluacionesController from '../controllers/evaluaciones.controller.js';
import { validateCreateEvaluacion, handleValidationErrors } from '../utils/validators.js';
import { autenticado } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Crear evaluación (requiere autenticación y validaciones)
router.post(
  '/',
  autenticado,
  validateCreateEvaluacion,
  handleValidationErrors,
  evaluacionesController.crearEvaluacion
);

// Obtener evaluaciones de un asesor
router.get('/:id_asesor', evaluacionesController.getEvaluacionesByAsesor);

export default router;