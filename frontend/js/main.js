// Inicializacion global de la aplicacion
// Este archivo se ejecuta en TODAS las paginas que lo incluyen

// Paginas que requieren sesion activa para poder verlas
const PAGINAS_PROTEGIDAS = [
  'dashboard.html',
  'notificaciones.html',
  'registro_asesoria.html',
  'perfil_asesor.html',
  'buscador.html'
];

document.addEventListener('DOMContentLoaded', () => {

  const paginaActual = window.location.pathname.split('/').pop() || 'index.html';

  if (PAGINAS_PROTEGIDAS.includes(paginaActual)) {
    if (!sessionManager.isSessionActive()) {
      console.warn('Sesion requerida pero no hay datos locales. Redirigiendo al login...');
      window.location.href = 'index.html';
      return;
    }
  }
  // Si hay sesion activa, mostrar el nombre del usuario en la navbar
  if (sessionManager.isSessionActive()) {
    const user = sessionManager.getUser();
    console.log('Usuario autenticado:', user.nombre_usuario);
    // Mostrar info del usuario si el elemento existe en la pagina
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
      userInfo.textContent = `Bienvenido, ${user.nombre_usuario}`;
    }
  }
  // Configurar listeners globales (logout, etc.)
  setupGlobalListeners();
});

function setupGlobalListeners() {

  // se añade e.preventDefault() para evitar que el <a href="#"> navegue antes
  // de que termine la acción async, y asegurar que se cierre sesión igual
  // si el backend falla
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault(); // impide la navegación por defecto del <a>

      try {
        await apiManager.logout();
      } catch (error) {
        // si el backend falla, el logout local continúa de todas formas
        console.warn('Error al notificar logout al servidor:', error);
      } finally {
        // Siempre limpiar sesion local y redirigir
        sessionManager.clearSession();
        window.location.href = 'index.html'; // siempre redirige
      }
    });
  }
}