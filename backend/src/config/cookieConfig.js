// Configuración de cookies seguras
// Opciones para guardar el token JWT en cookies de forma segura

// PRODUCCIÓN
// httpOnly → el token es invisible para JavaScript (previene XSS)
// secure: true → solo se envía en HTTPS
// sameSite: 'strict' → solo en peticiones del mismo origen (previene CSRF)
export const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 1 * 24 * 60 * 60 * 1000  // 1 día en milisegundos
};

// DESARROLLO LOCAL
// sameSite: 'lax' funciona en HTTP local sin necesitar secure: true.
// sameSite: 'none' requiere FORZOSAMENTE secure: true (HTTPS), por eso el
// navegador rechazaba la cookie silenciosamente y el backend respondía 401.
export const cookieOptionsDev = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  maxAge: 1 * 24 * 60 * 60 * 1000  // 1 día en milisegundos
};