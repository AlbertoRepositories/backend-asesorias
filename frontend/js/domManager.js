/**
 * Gestor centralizado de manipulación del DOM
 * Proporciona métodos reutilizables para actualizar la interfaz
 */

class DomManager {
  /**
   * Obtiene un elemento del DOM por ID
   * @param {string} id
   * @returns {HTMLElement}
   */
  static getElement(id) {
    const element = document.getElementById(id);
    if (!element) console.warn(`⚠️ Elemento no encontrado: ${id}`);
    return element;
  }

  /**
   * Obtiene múltiples elementos
   * @param {string} selector - Selector CSS
   * @returns {NodeList}
   */
  static getElements(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Establece el contenido HTML de un elemento
   * @param {string} elementId
   * @param {string} html
   */
  static setHTML(elementId, html) {
    const element = this.getElement(elementId);
    if (element) element.innerHTML = html;
  }

  /**
   * Establece el valor de un input
   * @param {string} elementId
   * @param {any} value
   */
  static setValue(elementId, value) {
    const element = this.getElement(elementId);
    if (element) element.value = value;
  }

  /**
   * Obtiene el valor de un input
   * @param {string} elementId
   * @returns {string}
   */
  static getValue(elementId) {
    return this.getElement(elementId)?.value || '';
  }

  /**
   * Muestra un elemento
   * @param {string} elementId
   */
  static show(elementId) {
    const element = this.getElement(elementId);
    if (element) element.style.display = 'block';
  }

  /**
   * Oculta un elemento
   * @param {string} elementId
   */
  static hide(elementId) {
    const element = this.getElement(elementId);
    if (element) element.style.display = 'none';
  }

  /**
   * Agrega clase CSS
   * @param {string} elementId
   * @param {string} className
   */
  static addClass(elementId, className) {
    this.getElement(elementId)?.classList.add(className);
  }

  /**
   * Quita clase CSS
   * @param {string} elementId
   * @param {string} className
   */
  static removeClass(elementId, className) {
    this.getElement(elementId)?.classList.remove(className);
  }

  /**
   * Agrega evento a elemento
   * @param {string} elementId
   * @param {string} eventType - 'click', 'submit', etc
   * @param {Function} callback
   */
  static addEventListener(elementId, eventType, callback) {
    const element = this.getElement(elementId);
    if (element) element.addEventListener(eventType, callback);
  }

  /**
   * Renderiza una lista de asesorías
   * @param {string} containerId
   * @param {Array} asesorias
   * @param {Function} onSelect - Callback cuando se selecciona una
   */
  static renderAsesorias(containerId, asesorias, onSelect) {
    const container = this.getElement(containerId);
    if (!container) return;

    container.innerHTML = asesorias.map(asesoria => `
      <div class="asesoria-card" data-id="${asesoria._id}">
        <h3>${asesoria.descripcion}</h3>
        <p><strong>Materia:</strong> ${asesoria.asignaturaId}</p>
        <p><strong>Estado:</strong> ${asesoria.estado}</p>
        <button class="btn-select" data-id="${asesoria._id}">Ver detalles</button>
      </div>
    `).join('');

    // Agregar listeners
    container.querySelectorAll('.btn-select').forEach(btn => {
      btn.addEventListener('click', (e) => onSelect(e.target.dataset.id));
    });
  }

  /**
   * Abre un modal
   * @param {string} modalId
   */
  static openModal(modalId) {
    this.show(modalId);
    this.getElement(modalId)?.classList.add('active');
  }

  /**
   * Cierra un modal
   * @param {string} modalId
   */
  static closeModal(modalId) {
    this.hide(modalId);
    this.getElement(modalId)?.classList.remove('active');
  }

  /**
   * Muestra notificación tipo toast
   * @param {string} message
   * @param {string} type - 'success', 'error', 'info'
   */
  static showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      border-radius: 4px;
      z-index: 9999;
      animation: slideIn 0.3s ease-in-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  /**
   * Redirige a otra página
   * @param {string} page - Nombre del archivo html
   */
  static redirect(page) {
    window.location.href = `./${page}.html`;
  }
}