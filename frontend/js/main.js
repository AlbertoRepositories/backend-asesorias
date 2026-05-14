// Inicializacion global de la aplicacion
// Este archivo se ejecuta en TODAS las paginas que lo incluyen
 
// Paginas que requieren sesion activa para poder verlas
// Si el usuario llega a estas sin haber hecho login, se le manda al index
const PAGINAS_PROTEGIDAS = [
  'dashboard.html',
  'notificaciones.html',
  'registro_asesoria.html',
  'perfil.html',
  'buscador.html'
];
 
document.addEventListener('DOMContentLoaded', () => {
 
  // Obtener el nombre del archivo actual (ej: "dashboard.html")
  const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
 
  // Si la pagina requiere sesion y no hay sesion activa -> redirigir al login
  if (PAGINAS_PROTEGIDAS.includes(paginaActual) && !sessionManager.isSessionActive()) {
    console.warn('Sesion requerida. Redirigiendo al login...');
    window.location.href = 'index.html';
    return; // Detener ejecucion para no intentar pintar la pagina
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