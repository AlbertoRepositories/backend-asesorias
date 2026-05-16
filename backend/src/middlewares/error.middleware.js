// Middleware global de errores
export const errorHandler = (err, req, res, next) => {
  console.error(err); // Para debug en consola

  // Error de ID inválido en Mongo (CastError)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_ID',
      message: `El valor "${err.value}" no es un ID válido para el campo "${err.path}"`
    });
  }

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      error: err.message
    });
  }

  // Error por defecto
  res.status(err.status || 500).json({
    success: false,
    code: err.code || 'SERVER_ERROR'
  });
};