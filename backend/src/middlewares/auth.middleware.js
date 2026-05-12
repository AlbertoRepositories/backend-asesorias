import jwt from 'jsonwebtoken';

// Middleware para proteger rutas
export const requireAuth = (req, res, next) => {

  // Obtiene header Authorization
  const header = req.headers.authorization;

  // Si no existe → error
  if (!header) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED'
    });
  }

  // Extrae el token (formato: Bearer TOKEN)
  const token = header.split(' ')[1];

  try {
    // Verifica el token con la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guarda datos del usuario en la request
    req.user = decoded;

    // Continúa a la siguiente función
    next();

  } catch {
    // Token inválido
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED'
    });
  }
};