// Utilidades de validación con express-validator
// Importa las funciones de validación de express-validator
import { body, validationResult, param, query } from 'express-validator';

// Middleware para manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Errores de validación en los datos enviados',
      details: errors.array().map(error => ({
        field: error.param,
        message: error.msg
      }))
    });
  }
  
  next();
};

// Validaciones para registro de usuario
export const validateRegister = [
  body('nombre_usuario')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es requerido')
    .isLength({ min: 3 }).withMessage('Nombre de usuario mínimo 3 caracteres')
    .isLength({ max: 30 }).withMessage('Nombre de usuario máximo 30 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Solo letras, números, guiones y guiones bajos permitidos'),
  
  body('correo')
    .trim()
    .notEmpty().withMessage('El correo es requerido')
    .isEmail().withMessage('Formato de correo inválido')
    .normalizeEmail(),
  
  body('contraseña')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 7 }).withMessage('Contraseña mínimo 7 caracteres')
    .matches(/[A-Z]/).withMessage('Contraseña debe tener al menos una mayúscula')
    .matches(/[a-z]/).withMessage('Contraseña debe tener al menos una minúscula')
    .matches(/\d/).withMessage('Contraseña debe tener al menos un número'),
  
  body('tipo_usuario')
    .trim()
    .notEmpty().withMessage('El tipo de usuario es requerido')
    .isIn(['asesor', 'asesorado']).withMessage('Tipo de usuario debe ser asesor o asesorado')
];

// Validaciones para login
export const validateLogin = [
  body('correo')
    .trim()
    .notEmpty().withMessage('El correo es requerido')
    .isEmail().withMessage('Formato de correo inválido'),
  
  body('contraseña')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 7 }).withMessage('Contraseña mínimo 7 caracteres')
];

// Validaciones para crear asesoría
export const validateCreateAsesoria = [
  body('asignaturaId')
    .trim()
    .notEmpty().withMessage('La asignatura es requerida'),
  
  body('descripcion')
    .trim()
    .notEmpty().withMessage('La descripción es requerida')
    .isLength({ min: 30 }).withMessage('Descripción mínimo 30 caracteres')
    .isLength({ max: 600 }).withMessage('Descripción máximo 600 caracteres'),
  
  body('horario')
    .notEmpty().withMessage('El horario es requerido')
    .isISO8601().withMessage('Formato de fecha inválido'),
  
  body('duracionMin')
    .notEmpty().withMessage('La duración es requerida')
    .isInt({ min: 15 }).withMessage('Duración mínimo 15 minutos'),
  
  body('cupo')
    .notEmpty().withMessage('El cupo es requerido')
    .isInt({ min: 1 }).withMessage('El cupo debe ser mínimo 1')
];

// Validaciones para editar asesoría
export const validateEditAsesoria = [
  body('descripcion')
    .optional()
    .trim()
    .isLength({ min: 30 }).withMessage('Descripción mínimo 30 caracteres')
    .isLength({ max: 600 }).withMessage('Descripción máximo 600 caracteres'),
  
  body('horario')
    .optional()
    .isISO8601().withMessage('Formato de fecha inválido'),
  
  body('duracionMin')
    .optional()
    .isInt({ min: 15 }).withMessage('Duración mínimo 15 minutos'),
  
  body('cupo')
    .optional()
    .isInt({ min: 1 }).withMessage('El cupo debe ser mínimo 1')
];

// Validaciones para crear evaluación
export const validateCreateEvaluacion = [
  body('asesorId')
    .trim()
    .notEmpty().withMessage('El ID del asesor es requerido'),
  
  body('asesoriaId')
    .trim()
    .notEmpty().withMessage('El ID de la asesoría es requerido'),
  
  body('calificacion')
    .notEmpty().withMessage('La calificación es requerida')
    .isInt({ min: 1, max: 5 }).withMessage('Calificación debe estar entre 1 y 5'),
  
  body('comentario')
    .optional()
    .trim()
    .isLength({ max: 634 }).withMessage('Comentario máximo 634 caracteres')
];

// Validaciones para inscripción
export const validateEnrollment = [
  body('asesoriaId')
    .trim()
    .notEmpty().withMessage('El ID de la asesoría es requerido')
];