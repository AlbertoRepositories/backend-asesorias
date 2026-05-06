import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { crearEvaluacion, getEvaluacionesByAsesor } from '../controllers/evaluaciones.controller.js';

const router = express.Router();

// Crear evaluación
router.post('/', requireAuth, crearEvaluacion);

// Obtener evaluaciones por asesor
router.get('/:id_asesor', requireAuth, getEvaluacionesByAsesor);

export default router;