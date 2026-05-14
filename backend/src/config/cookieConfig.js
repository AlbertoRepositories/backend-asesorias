// Configuración de cookies seguras
// Opciones para guardar el token en cookies de forma segura

export const cookieOptions = {
  // El token solo será accesible desde el servidor, no desde JavaScript
  httpOnly: true,
  
  // La cookie solo se envía en conexiones HTTPS
  secure: process.env.NODE_ENV === 'production',
  
  // La cookie se envía solo en peticiones del mismo sitio (CSRF protection)
  sameSite: 'strict',
  
  // Duración de la cookie en milisegundos (7 días)
  maxAge: 7 * 24 * 60 * 60 * 1000
};

// Opciones alternativas para desarrollo
export const cookieOptionsDev = {
  httpOnly: true,
  secure: false,
  sameSite: 'none',   // ← CAMBIAR de 'lax' a 'none' para cross-origin en dev
  maxAge: 7 * 24 * 60 * 60 * 1000
};