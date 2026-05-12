/**
 * Gestor de sesión del usuario
 * Maneja sessionStorage y localStorage de forma segura
 */

class SessionManager {
  constructor() {
    this.token = null;
    this.user = null;
    this.initializeSession();
  }

  /**
   * Inicializa la sesión desde storage
   */
  initializeSession() {
    const storedToken = sessionStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
    const storedUser = sessionStorage.getItem(API_CONFIG.STORAGE_KEYS.USER);

    if (storedToken && storedUser) {
      this.token = storedToken;
      this.user = JSON.parse(storedUser);
      console.log('✓ Sesión recuperada:', this.user.nombre_usuario);
    }
  }

  /**
   * Guarda los datos de sesión en sessionStorage
   * @param {Object} userData - Datos del usuario
   * @param {string} token - Token JWT
   */
  saveSession(userData, token) {
    this.token = token;
    this.user = userData;

    sessionStorage.setItem(API_CONFIG.STORAGE_KEYS.TOKEN, token);
    sessionStorage.setItem(API_CONFIG.STORAGE_KEYS.USER, JSON.stringify(userData));

    console.log('✓ Sesión guardada:', userData.nombre_usuario);
  }

  /**
   * Obtiene el token actual
   * @returns {string|null} Token o null si no existe
   */
  getToken() {
    return this.token;
  }

  /**
   * Obtiene los datos del usuario actual
   * @returns {Object|null} Datos del usuario o null
   */
  getUser() {
    return this.user;
  }

  /**
   * Verifica si hay una sesión activa
   * @returns {boolean}
   */
  isSessionActive() {
    return this.token !== null && this.user !== null;
  }

  /**
   * Obtiene el tipo de usuario
   * @returns {string} 'asesor' o 'asesorado'
   */
  getUserType() {
    return this.user?.tipo_usuario || null;
  }

  /**
   * Destruye la sesión
   */
  clearSession() {
    this.token = null;
    this.user = null;

    sessionStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER);

    console.log('✓ Sesión cerrada');
  }

  /**
   * Guarda notificaciones pendientes en localStorage
   * @param {Array} notifications - Array de notificaciones
   */
  saveNotifications(notifications) {
    localStorage.setItem(
      API_CONFIG.STORAGE_KEYS.NOTIFICATIONS,
      JSON.stringify(notifications)
    );
  }

  /**
   * Obtiene notificaciones pendientes de localStorage
   * @returns {Array} Array de notificaciones
   */
  getNotifications() {
    const stored = localStorage.getItem(API_CONFIG.STORAGE_KEYS.NOTIFICATIONS);
    return stored ? JSON.parse(stored) : [];
  }
}

// Instancia global
const sessionManager = new SessionManager();