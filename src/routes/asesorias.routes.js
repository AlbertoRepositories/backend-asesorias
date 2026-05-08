import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import * as asesoriasController from '../controllers/asesorias.controller.js';

const router = express.Router();

// Obtener todas las asesorías (con filtros opcionales como asignaturaId, fecha)
// GET /api/asesorias
router.get('/', requireAuth, asesoriasController.getAsesorias);

// Obtener asesorías de un asesor específico
// GET /api/asesorias/asesor/:id
router.get('/asesor/:id', requireAuth, asesoriasController.getAsesoriasPorAsesor);

// Obtener detalles de una asesoría específica
// GET /api/asesorias/:id
router.get('/:id', requireAuth, asesoriasController.getAsesoriaById);

// Crear una nueva asesoría (Solo asesores)
// POST /api/asesorias
router.post('/', requireAuth, asesoriasController.crearAsesoria);

// Editar una asesoría (Solo asesores)
// PUT /api/asesorias/:id
router.put('/:id', requireAuth, asesoriasController.editarAsesoria);

// Cancelar una asesoría (Solo asesores)
// DELETE /api/asesorias/:id
router.delete('/:id', requireAuth, asesoriasController.cancelarAsesoria);

export default router;
