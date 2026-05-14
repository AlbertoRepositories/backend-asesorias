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
// sameSite: 'lax' permite cookies entre origen distinto en navegación normal
// (ej: Live Server en :5500 llamando a backend en :5000).
// secure: false está bien en HTTP local.
export const cookieOptionsDev = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  maxAge: 1 * 24 * 60 * 60 * 1000  // 1 día en milisegundos
};