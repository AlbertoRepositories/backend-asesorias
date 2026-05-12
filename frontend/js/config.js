/**
 * Configuración centralizada de la API
 * Define URLs base y constantes de la aplicación
 */

const API_CONFIG = {
  // URL base de la API (cambia según el ambiente)
  BASE_URL: 'http://localhost:5000/api',
  
  // Timeouts
  FETCH_TIMEOUT: 5000,
  
  // Claves de storage
  STORAGE_KEYS: {
    TOKEN: 'auth_token',
    USER: 'current_user',
    NOTIFICATIONS: 'pending_notifications'
  },
  
  // Endpoints de la API
  ENDPOINTS: {
    // Autenticación
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout'
    },
    // Usuarios
    USERS: {
      PROFILE: '/users',
      UPDATE: '/users'
    },
    // Asesorías
    ASESORIAS: {
      LIST: '/asesorias',
      CREATE: '/asesorias',
      UPDATE: '/asesorias',
      DELETE: '/asesorias',
      BY_ADVISOR: '/asesorias/asesor'
    },
    // Inscripciones
    INSCRIPTIONS: {
      CREATE: '/asesorias/:id/inscripciones',
      DELETE: '/inscripciones/:id',
      BY_USER: '/inscripciones/usuario'
    },
    // Evaluaciones
    EVALUATIONS: {
      CREATE: '/evaluaciones',
      BY_ADVISOR: '/evaluaciones'
    },
    // Notificaciones
    NOTIFICATIONS: {
      LIST: '/notificaciones',
      MARK_AS_READ: '/notificaciones/:id/leer'
    }
  }
};

// Verificar que la API está disponible al cargar
console.log('API Config Loaded:', API_CONFIG.BASE_URL);