// Configuracion centralizada de la API
// Define URLs base y constantes de la aplicacion

const API_CONFIG = {
  // URL base de la API
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
    // Autenticacion
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout'
    },
    // Ruta de prueba/verificacion de sesion (necesaria para checkSession en buscadorModule)
    TEST: {
      PRIVATE: '/test/private'
    },
    // Usuarios
    USERS: {
      ME: '/users/me',
      MATERIAS_INTERES: '/users/materias-interes'
    },
    // Asesorias
    ASESORIAS: {
      LIST: '/asesorias',
      CREATE: '/asesorias',
      UPDATE: '/asesorias',
      DELETE: '/asesorias',
      BY_ADVISOR: '/asesorias/asesor'
    },
    // Inscripciones
    INSCRIPTIONS: {
      CREATE: '/inscripciones',
      DELETE: '/inscripciones/:id',
      BY_USER: '/inscripciones/mis-asesorias'
    },
    // Evaluaciones
    EVALUATIONS: {
      CREATE: '/evaluaciones',
      BY_ADVISOR: '/evaluaciones'
    },
    // Notificaciones
    NOTIFICATIONS: {
      LIST: '/notificaciones',
      MARK_AS_READ: '/notificaciones/:id/leida'
    }
  }
};

console.log('API Config Loaded:', API_CONFIG.BASE_URL);