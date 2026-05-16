// gestor centralizado de todas las peticiones HTTP al backend
// el token JWT se guarda en localStorage y se envía en el header Authorization

class ApiManager {

  // realiza una petición HTTP genérica
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

      return await response.json();

    } catch (error) {
      if (/^\d{3}$/.test(error.message)) {
        throw error;
      }
      console.error('Error en request:', error.message);
      throw new Error('NETWORK_ERROR');
    }
  }

  // métodos HTTP

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

  // autenticación

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
    localStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
    return this.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {});
  }

  // verifica si el token guardado sigue siendo válido en el backend
  async checkSession() {
    const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
    if (!token) return { valid: false, offline: false };

    try {
      await this.get(API_CONFIG.ENDPOINTS.TEST.PRIVATE);
      return { valid: true, offline: false };
    } catch (error) {
      if (error.message === '401') {
        localStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
        return { valid: false, offline: false };
      }
      return { valid: true, offline: true };
    }
  }

  // usuarios

  // devuelve datos completos del usuario con materias de interés
  async getMe() {
    return this.get('/auth/me');
  }

  // guarda arreglo de ids de materias de interés
  async updateMateriasInteres(materiasIds) {
    return this.patch('/users/materias-interes', { materias_interes: materiasIds });
  }

  // devuelve arreglo vacío si el usuario es asesor (no tiene asesores seguidos)
  async getAsesoresSeguidos() {
    if (sessionManager.getUserType() === 'asesor') {
      return { success: true, data: [] };
    }
    return this.get('/users/asesores-seguidos');
  }

  // la URL incluye el asesorId directamente, no como variable separada
  async seguirAsesor(asesorId) {
    return this.post(`/users/seguir/${asesorId}`, {});
  }

  async dejarDeSeguirAsesor(asesorId) {
    return this.delete(`/users/seguir/${asesorId}`);
  }

  // asesorías:

  async getAsesorias(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const endpoint = params ? `/asesorias?${params}` : '/asesorias';
    return this.get(endpoint);
  }

  async createAsesoria(datosAsesoria) {
    return this.post('/asesorias', datosAsesoria);
  }

  async getMyAsesorias() {
    const user = sessionManager.getUser();
    if (!user) return { data: [] };
    return this.get(`/asesorias/asesor/${user._id}`);
  }

  async updateAsesoria(id, datos) {
    return this.put(`/asesorias/${id}`, datos);
  }

  async deleteAsesoria(id) {
    return this.delete(`/asesorias/${id}`);
  }

  // inscripciones

  async enrollInAsesoria(asesoriaId) {
    return this.post('/inscripciones', { asesoriaId });
  }

  async cancelEnrollment(inscripcionId) {
    return this.delete(`/inscripciones/${inscripcionId}`);
  }

  async getMyEnrollments() {
    return this.get('/inscripciones/mis-asesorias');
  }

  // evaluaciones

  // los campos se llaman asesorId y asesoriaId (el backend los espera así)
  async evaluateAdvisor({ asesorId, asesoriaId, calificacion, comentario }) {
    return this.post('/evaluaciones', { asesorId, asesoriaId, calificacion, comentario });
  }

  async getAdvisorEvaluations(asesorId) {
    return this.get(`/evaluaciones/${asesorId}`);
  }

  // notificaciones

  async getNotifications() {
    return this.get('/notificaciones');
  }

  async markNotificationAsRead(notificationId) {
    return this.patch(`/notificaciones/${notificationId}/leida`, {});
  }
}

// instancia global usada por todos los módulos
const apiManager = new ApiManager();