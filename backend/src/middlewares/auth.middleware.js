import jwt from 'jsonwebtoken';

// Middleware para verificar autenticación
export const requireAuth = (req, res, next) => {
  try {
    // Obtener token desde cookie o Authorization header
    let token = req.cookies?.authToken;

    // Soporte para Bearer token desde frontend
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');

      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    // Si no existe token
    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_REQUIRED',
        message: 'Token requerido'
      });
    }

    // Verificar JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    );

    // Guardar usuario decodificado en request
    req.user = decoded;

    // Continuar
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
