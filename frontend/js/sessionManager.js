// Gestor de sesion del usuario
// El token JWT va en cookies httpOnly (lo maneja el backend automáticamente).
// Los datos del usuario se guardan en sessionStorage con respaldo en localStorage,
// para que la sesión sobreviva navegaciones entre páginas del mismo dominio.

class SessionManager {
  constructor() {
    this.user = null;
    this.initializeSession();
  }

  // Intenta recuperar la sesión desde sessionStorage primero,
  // y si no existe, desde localStorage (respaldo entre páginas).
  initializeSession() {
    try {
      let stored = sessionStorage.getItem(API_CONFIG.STORAGE_KEYS.USER);

      // Respaldo: si sessionStorage está vacío pero localStorage tiene datos, usarlo
      if (!stored) {
        stored = localStorage.getItem(API_CONFIG.STORAGE_KEYS.USER);
        if (stored) {
          // Restaurar en sessionStorage para lecturas futuras dentro de la misma pestaña
          sessionStorage.setItem(API_CONFIG.STORAGE_KEYS.USER, stored);
        }
      }

      if (stored) {
        this.user = JSON.parse(stored);
        console.log('Sesión recuperada:', this.user.nombre_usuario);
      }
    } catch (e) {
      console.warn('Error al recuperar sesión:', e);
      this.user = null;
    }
  }

  // Guarda los datos del usuario.
  // Se escribe en AMBOS storages para que la sesión persista al navegar entre páginas.
  saveSession(userData) {
    this.user = userData;
    const json = JSON.stringify(userData);
    sessionStorage.setItem(API_CONFIG.STORAGE_KEYS.USER, json);
    localStorage.setItem(API_CONFIG.STORAGE_KEYS.USER, json);
    console.log('Sesión guardada:', userData.nombre_usuario);
  }

  getUser() {
    return this.user;
  }

  isSessionActive() {
    return this.user !== null;
  }

  getUserType() {
    return this.user?.tipo_usuario || null;
  }

  // Destruye la sesión en ambos storages.
  clearSession() {
    this.user = null;
    sessionStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER);
    localStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER);
    console.log('Sesión cerrada');
  }

  // Notificaciones pendientes (se mantienen en localStorage porque sobreviven pestañas)
  saveNotifications(notifications) {
    localStorage.setItem(
      API_CONFIG.STORAGE_KEYS.NOTIFICATIONS,
      JSON.stringify(notifications)
    );
  }

  getNotifications() {
    const stored = localStorage.getItem(API_CONFIG.STORAGE_KEYS.NOTIFICATIONS);
    return stored ? JSON.parse(stored) : [];
  }
}

// Instancia global
const sessionManager = new SessionManager();