import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateRegister, validateLogin, handleValidationErrors } from '../utils/validators.js';

const router = express.Router();

// Ruta de registro con validaciones de express-validator
router.post(
  '/register',
  validateRegister,
  handleValidationErrors,
  authController.register
);

// Ruta de login con validaciones de express-validator
router.post(
  '/login',
  validateLogin,
  handleValidationErrors,
  authController.login
);

// Ruta de logout
router.post('/logout', authController.logout);

export default router;