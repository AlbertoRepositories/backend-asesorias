/**
 * Lógica para gestión de asesorías
 * CRUD de asesorías y manipulación de datos
 */

class AseoriasModule {
  constructor() {
    this.asesorias = [];
    this.asesoriaSeleccionada = null;
    this.initialize();
  }

  async initialize() {
    await this.loadAsesorias();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Botón para crear asesoría (solo asesor)
    const btnCreateAsesoria = document.getElementById('btn-create-asesoria');
    if (btnCreateAsesoria) {
      btnCreateAsesoria.addEventListener('click', () => this.showCreateModal());
    }

    // Formulario de crear asesoría
    const formCreateAsesoria = document.getElementById('form-create-asesoria');
    if (formCreateAsesoria) {
      formCreateAsesoria.addEventListener('submit', (e) => this.handleCreateAsesoria(e));
    }

    // Buscador con filtros
    const btnSearch = document.getElementById('btn-search-asesorias');
    if (btnSearch) {
      btnSearch.addEventListener('click', () => this.handleSearch());
    }
  }

  /**
   * Obtiene lista de asesorías del servidor
   */
  async loadAsesorias(filters = {}) {
    try {
      const response = await apiManager.getAsesorias(filters);
      this.asesorias = response.data;
      this.renderAsesorias();
      return response;
    } catch (error) {
      DomManager.showNotification(`Error cargando asesorías: ${error.message}`, 'error');
    }
  }

  /**
   * Obtiene asesorías del usuario actual (asesor)
   */
  async loadMyAsesorias() {
    try {
      const response = await apiManager.getMyAsesorias();
      this.asesorias = response.data;
      this.renderMyAsesorias();
      return response;
    } catch (error) {
      DomManager.showNotification(`Error cargando mis asesorías: ${error.message}`, 'error');
    }
  }

  /**
   * Renderiza lista de asesorías en la página
   */
  renderAsesorias() {
    const container = document.getElementById('asesorias-list');
    if (!container) return;

    if (this.asesorias.length === 0) {
      container.innerHTML = '<p>No hay asesorías disponibles</p>';
      return;
    }

    container.innerHTML = this.asesorias.map(asesoria => `
      <div class="asesoria-card" data-id="${asesoria._id}">
        <div class="asesoria-header">
          <h3>${asesoria.descripcion}</h3>
          <span class="estado-badge estado-${asesoria.estado}">${asesoria.estado}</span>
        </div>
        <div class="asesoria-body">
          <p><strong>Materia:</strong> ${asesoria.asignaturaId}</p>
          <p><strong>Hora:</strong> ${new Date(asesoria.horario).toLocaleString()}</p>
          <p><strong>Duración:</strong> ${asesoria.duracionMin} minutos</p>
          <p><strong>Cupo:</strong> <span class="cupo-info">${asesoria.cupo}</span></p>
        </div>
        <div class="asesoria-actions">
          <button class="btn btn-primary" onclick="aseoriasModule.viewDetails('${asesoria._id}')">
            Ver Detalles
          </button>
          ${sessionManager.getUserType() === 'asesor' ? `
            <button class="btn btn-secondary" onclick="aseoriasModule.editAsesoria('${asesoria._id}')">
              Editar
            </button>
            <button class="btn btn-danger" onclick="aseoriasModule.deleteAsesoria('${asesoria._id}')">
              Cancelar
            </button>
          ` : `
            <button class="btn btn-success" onclick="aseoriasModule.enrollAsesoria('${asesoria._id}')">
              Inscribirse
            </button>
          `}
        </div>
      </div>
    `).join('');
  }

  /**
   * Renderiza mis asesorías (asesor)
   */
  renderMyAsesorias() {
    const container = document.getElementById('my-asesorias-list');
    if (!container) return;

    if (this.asesorias.length === 0) {
      container.innerHTML = '<p>No has creado asesorías aún</p>';
      return;
    }

    container.innerHTML = this.asesorias.map(asesoria => `
      <tr>
        <td>${asesoria.descripcion}</td>
        <td>${new Date(asesoria.horario).toLocaleString()}</td>
        <td><span class="estado-badge estado-${asesoria.estado}">${asesoria.estado}</span></td>
        <td>
          <button onclick="aseoriasModule.editAsesoria('${asesoria._id}')" class="btn-small">Editar</button>
          <button onclick="aseoriasModule.deleteAsesoria('${asesoria._id}')" class="btn-small btn-danger">Cancelar</button>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Abre modal para crear asesoría
   */
  showCreateModal() {
    DomManager.openModal('modal-create-asesoria');
  }

  /**
   * Maneja creación de nueva asesoría
   */
  async handleCreateAsesoria(e) {
    e.preventDefault();

    const asignaturaId = DomManager.getValue('input-materia');
    const descripcion = DomManager.getValue('input-descripcion');
    const horario = DomManager.getValue('input-horario');
    const duracionMin = parseInt(DomManager.getValue('input-duracion'));
    const cupo = parseInt(DomManager.getValue('input-cupo'));

    // Validaciones
    if (!asignaturaId || !descripcion || !horario || !duracionMin || !cupo) {
      DomManager.showNotification('Todos los campos son requeridos', 'error');
      return;
    }

    if (descripcion.length < 30 || descripcion.length > 600) {
      DomManager.showNotification('Descripción entre 30 y 600 caracteres', 'error');
      return;
    }

    try {
      await apiManager.createAsesoria({
        asignaturaId,
        descripcion,
        horario,
        duracionMin,
        cupo
      });

      DomManager.showNotification('Asesoría creada exitosamente', 'success');
      DomManager.closeModal('modal-create-asesoria');
      await this.loadMyAsesorias();

    } catch (error) {
      DomManager.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Edita una asesoría
   */
  async editAsesoria(id) {
    // TODO: Implementar edición
    DomManager.showNotification('Función en desarrollo', 'info');
  }

  /**
   * Elimina una asesoría
   */
  async deleteAsesoria(id) {
    if (!confirm('¿Estás seguro de cancelar esta asesoría?')) return;

    try {
      await apiManager.deleteAsesoria(id);
      DomManager.showNotification('Asesoría cancelada', 'success');
      await this.loadMyAsesorias();
    } catch (error) {
      DomManager.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Ver detalles de una asesoría
   */
  viewDetails(id) {
    this.asesoriaSeleccionada = this.asesorias.find(a => a._id === id);
    DomManager.openModal('modal-asesoria-details');
    // TODO: Renderizar detalles
  }

  /**
   * Inscribir usuario en asesoría
   */
  async enrollAsesoria(id) {
    try {
      await apiManager.enrollInAsesoria(id);
      DomManager.showNotification('¡Inscripción exitosa!', 'success');
      await this.loadAsesorias();
    } catch (error) {
      DomManager.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Buscar asesorías con filtros
   */
  async handleSearch() {
    const asignaturaId = DomManager.getValue('filter-materia');
    const calificacionMin = DomManager.getValue('filter-calificacion');

    const filters = {};
    if (asignaturaId) filters.asignaturaId = asignaturaId;
    if (calificacionMin) filters.calificacionMin = calificacionMin;

    await this.loadAsesorias(filters);
    DomManager.showNotification('Búsqueda completada', 'info');
  }
}

// Instancia global
let aseoriasModule;

document.addEventListener('DOMContentLoaded', () => {
  if (sessionManager.isSessionActive()) {
    aseoriasModule = new AseoriasModule();
  }
});