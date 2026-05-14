// Gestor de sesion del usuario
// Maneja sessionStorage para datos de usuario (NO token, que va en cookies)
// El token se almacena en cookies httpOnly del navegador automaticamente

class SessionManager {
  constructor() {
    this.user = null;
    this.initializeSession();
  }

  // Inicializa la sesion desde storage
  initializeSession() {
    const storedUser = sessionStorage.getItem(API_CONFIG.STORAGE_KEYS.USER);

    if (storedUser) {
      this.user = JSON.parse(storedUser);
      console.log('Sesion recuperada:', this.user.nombre_usuario);
    }
  }

  // Guarda los datos de sesion en sessionStorage
  // userData: Datos del usuario (nombre, correo, tipo, etc)
  // NOTA: El token NO se guarda aqui, va en cookies del navegador
  saveSession(userData) {
    this.user = userData;
    sessionStorage.setItem(API_CONFIG.STORAGE_KEYS.USER, JSON.stringify(userData));
    console.log('Sesion guardada:', userData.nombre_usuario);
  }

  // Obtiene los datos del usuario actual
  // Retorna: Objeto con datos del usuario o null
  getUser() {
    return this.user;
  }

  // Verifica si hay una sesion activa
  // Retorna: true si hay usuario autenticado
  isSessionActive() {
    return this.user !== null;
  }

  // Obtiene el tipo de usuario
  // Retorna: 'asesor' o 'asesorado'
  getUserType() {
    return this.user?.tipo_usuario || null;
  }

  // Destruye la sesion
  // Limpia sessionStorage y datos en memoria
  clearSession() {
    this.user = null;
    sessionStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER);
    console.log('Sesion cerrada');
  }

  // Guarda notificaciones pendientes en localStorage
  // notifications: Array de notificaciones
  saveNotifications(notifications) {
    localStorage.setItem(
      API_CONFIG.STORAGE_KEYS.NOTIFICATIONS,
      JSON.stringify(notifications)
    );
  }

  // Obtiene notificaciones pendientes de localStorage
  // Retorna: Array de notificaciones
  getNotifications() {
    const stored = localStorage.getItem(API_CONFIG.STORAGE_KEYS.NOTIFICATIONS);
    return stored ? JSON.parse(stored) : [];
  }
}

// Instancia global
const sessionManager = new SessionManager();