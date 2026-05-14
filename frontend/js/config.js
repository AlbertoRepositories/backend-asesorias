// Configuracion centralizada de la API
// Define URLs base y constantes de la aplicacion

const API_CONFIG = {
  // URL base de la API - CORRECTED: localhost:5000 es el backend
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
    // Usuarios
    USERS: {
      PROFILE: '/users',
      UPDATE: '/users'
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

// Verificar que la API esta disponible al cargar
console.log('API Config Loaded:', API_CONFIG.BASE_URL);