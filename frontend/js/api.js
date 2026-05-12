/**
 * Gestor centralizado de todas las peticiones HTTP
 * Implementa fetch con manejo de errores y autenticación
 */

class ApiManager {
  /**
   * Realiza una petición HTTP genérica
   * @param {string} endpoint - Ruta relativa del endpoint
   * @param {Object} options - Opciones de fetch
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async request(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    // Headers por defecto
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Agregar token si existe sesión activa
    if (sessionManager.isSessionActive()) {
      headers['Authorization'] = `Bearer ${sessionManager.getToken()}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Manejar errores HTTP
      if (!response.ok) {
        throw new Error(
          `Error ${response.status}: ${response.statusText}`
        );
      }

      // Parsear respuesta JSON
      const data = await response.json();
      console.log(`✓ ${options.method || 'GET'} ${endpoint}`, data);
      return data;

    } catch (error) {
      console.error(`✗ ${options.method || 'GET'} ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * GET - Obtener datos
   * @param {string} endpoint
   * @returns {Promise}
   */
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * POST - Crear datos
   * @param {string} endpoint
   * @param {Object} data
   * @returns {Promise}
   */
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT - Actualizar datos
   * @param {string} endpoint
   * @param {Object} data
   * @returns {Promise}
   */
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE - Eliminar datos
   * @param {string} endpoint
   * @returns {Promise}
   */
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ==================== AUTENTICACIÓN ====================

  /**
   * Registrar nuevo usuario
   */
  async register(userData) {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);
  }

  /**
   * Iniciar sesión
   */
  async login(correo, contraseña) {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      correo,
      contraseña
    });
  }

  // ==================== ASESORÍAS ====================

  /**
   * Obtener todas las asesorías (con filtros)
   */
  async getAsesorias(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const endpoint = params 
      ? `${API_CONFIG.ENDPOINTS.ASESORIAS.LIST}?${params}`
      : API_CONFIG.ENDPOINTS.ASESORIAS.LIST;
    return this.get(endpoint);
  }

  /**
   * Crear nueva asesoría
   */
  async createAsesoria(datosAsesoria) {
    return this.post(API_CONFIG.ENDPOINTS.ASESORIAS.CREATE, datosAsesoria);
  }

  /**
   * Obtener asesorías del asesor actual
   */
  async getMyAsesorias() {
    const userId = sessionManager.getUser()._id;
    return this.get(`${API_CONFIG.ENDPOINTS.ASESORIAS.BY_ADVISOR}/${userId}`);
  }

  /**
   * Actualizar asesoría
   */
  async updateAsesoria(id, datos) {
    return this.put(`${API_CONFIG.ENDPOINTS.ASESORIAS.UPDATE}/${id}`, datos);
  }

  /**
   * Cancelar asesoría
   */
  async deleteAsesoria(id) {
    return this.delete(`${API_CONFIG.ENDPOINTS.ASESORIAS.DELETE}/${id}`);
  }

  // ==================== INSCRIPCIONES ====================

  /**
   * Inscribirse en una asesoría
   */
  async enrollInAsesoria(asesoriaId) {
    const endpoint = API_CONFIG.ENDPOINTS.INSCRIPTIONS.CREATE.replace(':id', asesoriaId);
    return this.post(endpoint, {});
  }

  /**
   * Cancelar inscripción
   */
  async cancelEnrollment(inscripcionId) {
    const endpoint = API_CONFIG.ENDPOINTS.INSCRIPTIONS.DELETE.replace(':id', inscripcionId);
    return this.delete(endpoint);
  }

  /**
   * Obtener mis inscripciones
   */
  async getMyEnrollments() {
    const userId = sessionManager.getUser()._id;
    return this.get(`${API_CONFIG.ENDPOINTS.INSCRIPTIONS.BY_USER}/${userId}`);
  }

  // ==================== EVALUACIONES ====================

  /**
   * Evaluar a un asesor
   */
  async evaluateAdvisor(evaluacionData) {
    return this.post(API_CONFIG.ENDPOINTS.EVALUATIONS.CREATE, evaluacionData);
  }

  /**
   * Obtener evaluaciones de un asesor
   */
  async getAdvisorEvaluations(asesorId) {
    return this.get(`${API_CONFIG.ENDPOINTS.EVALUATIONS.BY_ADVISOR}/${asesorId}`);
  }

  // ==================== NOTIFICACIONES ====================

  /**
   * Obtener notificaciones del usuario
   */
  async getNotifications() {
    return this.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST);
  }

  /**
   * Marcar notificación como leída
   */
  async markNotificationAsRead(notificationId) {
    const endpoint = API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_AS_READ.replace(':id', notificationId);
    return this.put(endpoint, {});
  }
}

// Instancia global
const apiManager = new ApiManager();