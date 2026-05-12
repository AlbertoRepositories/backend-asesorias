import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Ruta protegida de prueba
router.get('/private', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Accediste a ruta protegida',
    user: req.user // viene del token
  });
});

export default router;