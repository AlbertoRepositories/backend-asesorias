// Gestor centralizado de todas las peticiones HTTP
// Token se guarda en localStorage y se envía en Authorization header

class ApiManager {

  // Realiza una petición HTTP genérica
  async request(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    // Obtener el token del localStorage (si existe)
    const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Si hay token, incluirlo en Authorization header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        // Permite envío de cookies HTTPOnly si el backend las usa
        credentials: 'include'
      });

      // Si no está ok, lanzar error con el código HTTP
      if (!response.ok) {
        throw new Error(response.status.toString());
      }

      const data = await response.json();
      return data;

    } catch (error) {
      // Si es un error que ya lanzamos (código HTTP)
      if (/^\d{3}$/.test(error.message)) {
        throw error;
      }
      // Error de red
      console.error('Error en request:', error.message);
      throw new Error('NETWORK_ERROR');
    }
  }

  // ==================== MÉTODOS HTTP ====================

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
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
    const response = await this.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, { correo, contraseña });
    if (response.success && response.data.token) {
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.TOKEN, response.data.token);
    }
    return response;
  }

  async logout() {
    // Limpiar token del localStorage
    localStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
    return this.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {});
  }

  // Verificar si la sesión es válida
  async checkSession() {
    const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
    if (!token) {
      return { valid: false, offline: false };
    }
    try {
      await this.get(API_CONFIG.ENDPOINTS.TEST.PRIVATE);
      return { valid: true, offline: false };
    } catch (error) {
      if (error.message === '401') {
        // Token inválido o expirado
        localStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
        return { valid: false, offline: false };
      }
      if (error.message === 'NETWORK_ERROR') {
        return { valid: true, offline: true };
      }
      return { valid: true, offline: true };
    }
  }

  // ==================== USUARIOS ====================

  // devuelve datos completos del usuario con materias de interés pobladas
  async getMe() {
    return this.get(API_CONFIG.ENDPOINTS.USERS.ME);
  }

  // guarda arreglo de ids de materias de interés
  async updateMateriasInteres(materiasIds) {
    return this.patch(API_CONFIG.ENDPOINTS.USERS.MATERIAS_INTERES, {
      materias_interes: materiasIds
    });
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