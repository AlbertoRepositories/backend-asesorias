// Inicializacion global de la aplicacion
// Este archivo se ejecuta en TODAS las paginas que lo incluyen
 
// Paginas que requieren sesion activa para poder verlas
// NOMBRES REALES DE ARCHIVOS EN TU PROYECTO:
const PAGINAS_PROTEGIDAS = [
  'dashboard.html',
  'notificaciones.html',
  'registro_asesoria.html',
  'perfil_asesor.html',      // ← CORREGIDO: era 'perfil.html'
  'buscador.html'
];
 
document.addEventListener('DOMContentLoaded', () => {
 
  // Obtener el nombre del archivo actual (ej: "dashboard.html")
  const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
 
  // Si la pagina requiere sesion
  if (PAGINAS_PROTEGIDAS.includes(paginaActual)) {
    
    // CORRECCIÓN: Solo usar sesion local, NO hacer checkSession()
    // checkSession() causaba un bucle infinito de redirecciones
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
 
  // Boton de logout (si existe en la pagina)
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await apiManager.logout();
      } catch (error) {
        // Si el backend falla, continuamos con el logout local de todas formas
        console.warn('Error al notificar logout al servidor:', error);
      } finally {
        // Siempre limpiar sesion local y redirigir
        sessionManager.clearSession();
        window.location.href = 'index.html';
      }
    });
  }
}