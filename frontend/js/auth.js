/**
 * Lógica de autenticación (login y registro)
 * Maneja validación y comunicación con API
 */

class AuthModule {
  constructor() {
    this.initializeAuthPage();
  }

  initializeAuthPage() {
    // Si ya hay sesión activa (ej: el usuario volvió a index habiendo iniciado sesión antes)
    // lo mandamos directo al dashboard sin que tenga que loguearse de nuevo
    if (sessionManager.isSessionActive()) {
      this.redirectToDashboard();
      return;
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Botones para cambiar entre login y registro
    const btnToRegister = document.getElementById('btn-to-register');
    const btnToLogin    = document.getElementById('btn-to-login');

    if (btnToRegister) {
      btnToRegister.addEventListener('click', () => this.showRegisterForm());
    }
    if (btnToLogin) {
      btnToLogin.addEventListener('click', () => this.showLoginForm());
    }

    // Formularios (usados solo si la pagina tiene los forms de auth.js)
    // Nota: index.html usa su propio script inline; esto cubre otras paginas
    const formLogin    = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    if (formLogin) {
      formLogin.addEventListener('submit', (e) => this.handleLogin(e));
    }
    if (formRegister) {
      formRegister.addEventListener('submit', (e) => this.handleRegister(e));
    }
  }

  showLoginForm() {
    DomManager.show('login-container');
    DomManager.hide('register-container');
  }

  showRegisterForm() {
    DomManager.hide('login-container');
    DomManager.show('register-container');
  }

  /**
   * Maneja el formulario de login
   */
  async handleLogin(e) {
    e.preventDefault();

    const correo    = DomManager.getValue('login-email');
    const contraseña = DomManager.getValue('login-password');

    if (!this.validateEmail(correo)) {
      DomManager.showNotification('Email inválido', 'error');
      return;
    }

    if (!contraseña || contraseña.length < 7) {
      DomManager.showNotification('Contraseña debe tener mínimo 7 caracteres', 'error');
      return;
    }

    try {
      DomManager.showNotification('Iniciando sesión...', 'info');

      const response = await apiManager.login(correo, contraseña);

      // CORRECCIÓN: saveSession solo recibe el objeto usuario
      // El token se maneja automaticamente via cookies httpOnly del backend
      sessionManager.saveSession(response.data.usuario);

      this.redirectToDashboard();

    } catch (error) {
      DomManager.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Maneja el formulario de registro
   */
  async handleRegister(e) {
    e.preventDefault();

    const nombre_usuario       = DomManager.getValue('register-username');
    const correo               = DomManager.getValue('register-email');
    const contraseña           = DomManager.getValue('register-password');
    const confirmar_contraseña = DomManager.getValue('register-confirm-password');
    const tipo_usuario         = DomManager.getValue('register-type');

    if (!nombre_usuario || nombre_usuario.length < 3) {
      DomManager.showNotification('Nombre de usuario mínimo 3 caracteres', 'error');
      return;
    }

    if (!this.validateEmail(correo)) {
      DomManager.showNotification('Email inválido', 'error');
      return;
    }

    if (!this.validatePassword(contraseña)) {
      DomManager.showNotification(
        'Contraseña debe tener: min 7 caracteres, mayúscula, minúscula y número',
        'error'
      );
      return;
    }

    if (contraseña !== confirmar_contraseña) {
      DomManager.showNotification('Las contraseñas no coinciden', 'error');
      return;
    }

    try {
      DomManager.showNotification('Registrando usuario...', 'info');

      await apiManager.register({ nombre_usuario, correo, contraseña, tipo_usuario });

      DomManager.showNotification('Registro exitoso. Ahora inicia sesión.', 'success');

      // Mostrar formulario de login para que el usuario entre
      this.showLoginForm();

    } catch (error) {
      DomManager.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Valida formato de email
   */
  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Valida formato de contraseña
   */
  validatePassword(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/;
    return regex.test(password);
  }

  /**
   * Redirige al dashboard
   * El archivo real es dashboard.html para todos los tipos de usuario.
   */
  redirectToDashboard() {
    window.location.href = 'dashboard.html';
  }
}

// Inicializar cuando carga el DOM
document.addEventListener('DOMContentLoaded', () => {
  new AuthModule();
});