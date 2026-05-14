// Gestor centralizado de todas las peticiones HTTP
// IMPORTANTE: El token se envía en cookies automáticamente, NO en headers

class ApiManager {

  // Realiza una peticion HTTP generica
  async request(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        // Permite que las cookies httpOnly se envíen con cada petición
        credentials: 'include'
      });

      // Solo 401 significa sesión expirada/inválida
      if (response.status === 401) {
        if (typeof sessionManager !== 'undefined') {
          sessionManager.clearSession();
        }
        throw new Error('SESSION_EXPIRED');
      }

      // Otros errores HTTP: lanzar con el código para que el módulo decida qué hacer
      if (!response.ok) {
        throw new Error(`${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      // Re-lanzar errores que ya tienen formato esperado
      if (
        error.message === 'SESSION_EXPIRED' ||
        /^\d{3}$/.test(error.message)         // ej. "404", "409", "500"
      ) {
        throw error;
      }

      // Error de red (backend caído, CORS, timeout, etc.)
      // NO tratarlo como sesión expirada: solo re-lanzar con mensaje claro
      throw new Error('NETWORK_ERROR');
    }
  }

  // ==================== MÉTODOS HTTP ====================

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // Verifica si la cookie de sesión sigue siendo válida en el backend.
  // Retorna { valid: true/false } sin redirigir; el llamador decide qué hacer.
  async checkSession() {
    try {
      const response = await this.get(API_CONFIG.ENDPOINTS.TEST.PRIVATE);
      return { valid: response?.success === true, user: response?.user || null };
    } catch (error) {
      // Sesión inválida o expirada
      if (error.message === 'SESSION_EXPIRED') {
        return { valid: false };
      }
      // Error de red: no sabemos el estado real de la sesión,
      // asumir que sigue válida para no redirigir innecesariamente
      if (error.message === 'NETWORK_ERROR') {
        console.warn('checkSession: backend no disponible, se asume sesión local válida');
        return { valid: true, offline: true };
      }
      return { valid: false };
    }
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ==================== AUTENTICACION ====================

  async register(userData) {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);
  }

  async login(correo, contraseña) {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, { correo, contraseña });
  }

  async logout() {
    return this.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {});
  }

  // ==================== ASESORIAS ====================

  async getAsesorias(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const endpoint = params
      ? `${API_CONFIG.ENDPOINTS.ASESORIAS.LIST}?${params}`
      : API_CONFIG.ENDPOINTS.ASESORIAS.LIST;
    return this.get(endpoint);
  }

  async createAsesoria(datosAsesoria) {
    return this.post(API_CONFIG.ENDPOINTS.ASESORIAS.CREATE, datosAsesoria);
  }

  async getMyAsesorias() {
    const user = sessionManager.getUser();
    if (!user) return { data: [] };
    return this.get(`${API_CONFIG.ENDPOINTS.ASESORIAS.BY_ADVISOR}/${user._id}`);
  }

  async updateAsesoria(id, datos) {
    return this.put(`${API_CONFIG.ENDPOINTS.ASESORIAS.UPDATE}/${id}`, datos);
  }

  async deleteAsesoria(id) {
    return this.delete(`${API_CONFIG.ENDPOINTS.ASESORIAS.DELETE}/${id}`);
  }

  // ==================== INSCRIPCIONES ====================

  async enrollInAsesoria(asesoriaId) {
    return this.post(API_CONFIG.ENDPOINTS.INSCRIPTIONS.CREATE, { asesoriaId });
  }

  async cancelEnrollment(inscripcionId) {
    const endpoint = API_CONFIG.ENDPOINTS.INSCRIPTIONS.DELETE.replace(':id', inscripcionId);
    return this.delete(endpoint);
  }

  async getMyEnrollments() {
    return this.get(API_CONFIG.ENDPOINTS.INSCRIPTIONS.BY_USER);
  }

  // ==================== EVALUACIONES ====================

  async evaluateAdvisor(evaluacionData) {
    return this.post(API_CONFIG.ENDPOINTS.EVALUATIONS.CREATE, evaluacionData);
  }

  async getAdvisorEvaluations(asesorId) {
    return this.get(`${API_CONFIG.ENDPOINTS.EVALUATIONS.BY_ADVISOR}/${asesorId}`);
  }

  // ==================== NOTIFICACIONES ====================

  async getNotifications() {
    return this.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST);
  }

  async markNotificationAsRead(notificationId) {
    const endpoint = API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_AS_READ.replace(':id', notificationId);
    return this.patch(endpoint, {});
  }
}

// Instancia global
const apiManager = new ApiManager();