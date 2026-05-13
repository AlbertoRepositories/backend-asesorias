// frontend/assets/js/main.js
import { AuthModule } from './auth.js';
import { sessionStorage_utils } from './storage.js';
import { DOMUtils } from './dom.js';

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Verificar si el usuario está autenticado
  if (AuthModule.isAuthenticated()) {
    const user = AuthModule.getCurrentUser();
    console.log('Usuario autenticado:', user);
    // Cargar datos dinámicos según el usuario
  }
  
  // Inicializar event listeners globales
  setupGlobalListeners();
});

function setupGlobalListeners() {
  // Botón de logout (si existe)
  const logoutBtn = DOMUtils.querySelector('[data-logout]');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => AuthModule.logout());
  }
}