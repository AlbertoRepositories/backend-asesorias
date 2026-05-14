// Gestor centralizado de todas las peticiones HTTP
// Implementa fetch con manejo de errores y autenticacion
// IMPORTANTE: El token se envía en cookies automáticamente, NO en headers

class ApiManager {
  
  // Realiza una peticion HTTP generica
  // endpoint: Ruta relativa del endpoint ej: '/asesorias'
  // options: Opciones de fetch
  // NOTA: Las cookies se envían automáticamente por el navegador
  async request(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    // Headers por defecto
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // IMPORTANTE: NO agregar token en header porque el backend usa cookies
    // Las cookies con httpOnly se envían automáticamente por fetch

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        // IMPORTANTE: Permitir que se envíen cookies con las peticiones
        credentials: 'include'
      });

      // Manejar errores HTTP
      if (!response.ok) {
        if (response.status === 401) {
          if (typeof sessionManager !== 'undefined') {
            sessionManager.clearSession();
          }
          throw new Error('SESSION_EXPIRED');
        }

        throw new Error(
          `Error ${response.status}: ${response.statusText}`
        );
      }

      // Parsear respuesta JSON
      const data = await response.json();
      console.log(`Peticion exitosa ${options.method || 'GET'} ${endpoint}:`, data);
      return data;

    } catch (error) {
      console.error(`Error en peticion ${options.method || 'GET'} ${endpoint}:`, error);
      throw error;
    }
  }

  // GET - Obtener datos
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async checkSession() {
    try {
      const response = await this.get(API_CONFIG.ENDPOINTS.TEST.PRIVATE);
      return { valid: response?.success === true, user: response?.user || null };
    } catch (error) {
      if (error.message === 'SESSION_EXPIRED' || error.message.includes('401')) {
        return { valid: false };
      }
      throw error;
    }
  }

  // POST - Crear datos
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT - Actualizar datos
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // PATCH - Actualizar parcialmente
  patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // DELETE - Eliminar datos
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ==================== AUTENTICACION ====================

  // Registrar nuevo usuario
  async register(userData) {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);
  }

  // Iniciar sesion
  async login(correo, contraseña) {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      correo,
      contraseña
    });
  }

  // Cerrar sesion
  async logout() {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {});
  }

  // ==================== ASESORIAS ====================

  // Obtener todas las asesorias (con filtros)
  async getAsesorias(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const endpoint = params 
      ? `${API_CONFIG.ENDPOINTS.ASESORIAS.LIST}?${params}`
      : API_CONFIG.ENDPOINTS.ASESORIAS.LIST;
    return this.get(endpoint);
  }

  // Crear nueva asesoria
  async createAsesoria(datosAsesoria) {
    return this.post(API_CONFIG.ENDPOINTS.ASESORIAS.CREATE, datosAsesoria);
  }

  // Obtener asesorias del asesor actual
  async getMyAsesorias() {
    const user = sessionManager.getUser();
    if (!user) return { data: [] };
    return this.get(`${API_CONFIG.ENDPOINTS.ASESORIAS.BY_ADVISOR}/${user._id}`);
  }

  // Actualizar asesoria
  async updateAsesoria(id, datos) {
    return this.put(`${API_CONFIG.ENDPOINTS.ASESORIAS.UPDATE}/${id}`, datos);
  }

  // Cancelar asesoria
  async deleteAsesoria(id) {
    return this.delete(`${API_CONFIG.ENDPOINTS.ASESORIAS.DELETE}/${id}`);
  }

  // ==================== INSCRIPCIONES ====================

  // Inscribirse en una asesoria
  // el backend usa POST /api/inscripciones  con { asesoriaId } en el body
  async enrollInAsesoria(asesoriaId) {
    return this.post(API_CONFIG.ENDPOINTS.INSCRIPTIONS.CREATE, { asesoriaId });
  }

  // Cancelar inscripcion
  async cancelEnrollment(inscripcionId) {
    const endpoint = API_CONFIG.ENDPOINTS.INSCRIPTIONS.DELETE.replace(':id', inscripcionId);
    return this.delete(endpoint);
  }

  // Obtener mis inscripciones activas
  // el backend usa GET /api/inscripciones/mis-asesorias
  async getMyEnrollments() {
    return this.get(API_CONFIG.ENDPOINTS.INSCRIPTIONS.BY_USER);
  }

  // ==================== EVALUACIONES ====================

  // Evaluar a un asesor
  async evaluateAdvisor(evaluacionData) {
    return this.post(API_CONFIG.ENDPOINTS.EVALUATIONS.CREATE, evaluacionData);
  }

  // Obtener evaluaciones de un asesor
  async getAdvisorEvaluations(asesorId) {
    return this.get(`${API_CONFIG.ENDPOINTS.EVALUATIONS.BY_ADVISOR}/${asesorId}`);
  }

  // ==================== NOTIFICACIONES ====================

  // Obtener notificaciones del usuario
  async getNotifications() {
    return this.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST);
  }

  // Marcar notificacion como leida
  async markNotificationAsRead(notificationId) {
    const endpoint = API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_AS_READ.replace(':id', notificationId);
    return this.patch(endpoint, {});
  }
}

// Instancia global
const apiManager = new ApiManager();