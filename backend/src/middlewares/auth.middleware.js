import jwt from 'jsonwebtoken';

// Middleware para verificar autenticación
export const autenticado = (req, res, next) => {
  try {
    // Obtener el token de la cookie (NO del header Authorization)
    const token = req.cookies.authToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'NO_TOKEN',
        message: 'Token no encontrado. Por favor inicia sesión'
      });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guardar los datos del usuario en req.user para usarlos en los controllers
    req.user = decoded;

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Token expirado. Por favor inicia sesión de nuevo'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Token inválido'
      });
    }

    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'No autorizado'
    });
  }
};