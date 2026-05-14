// Inicializacion global de la aplicacion
// Este archivo se ejecuta en TODAS las paginas

document.addEventListener('DOMContentLoaded', () => {
  
  // Verificar si el usuario esta autenticado
  if (sessionManager.isSessionActive()) {
    const user = sessionManager.getUser();
    console.log('Usuario autenticado:', user.nombre_usuario);
    
    // Mostrar info del usuario en la navbar si existe el elemento
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
      userInfo.textContent = `Bienvenido, ${user.nombre_usuario}`;
    }
  }
  
  // Configurar event listeners globales
  setupGlobalListeners();
});

function setupGlobalListeners() {
  
  // Boton de logout si existe
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await apiManager.logout();
        sessionManager.clearSession();
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Error al cerrar sesion:', error);
        // Forzar logout local aunque el backend falle
        sessionManager.clearSession();
        window.location.href = 'index.html';
      }
    });
  }
}