import express from 'express';
import { crearAsignatura, getAsignaturas } from '../controllers/asignaturas.controller.js';

const router = express.Router();

router.post('/', crearAsignatura);
router.get('/', getAsignaturas);

export default router;
