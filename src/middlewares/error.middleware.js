// Middleware global de errores
export const errorHandler = (err, req, res, next) => {

  console.error(err); // Para debug

  res.status(500).json({
    success: false,
    code: 'SERVER_ERROR'
  });
};