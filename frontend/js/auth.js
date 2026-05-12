/**
 * Lógica de autenticación (login y registro)
 * Maneja validación y comunicación con API
 */

class AuthModule {
  constructor() {
    this.initializeAuthPage();
  }

  initializeAuthPage() {
    // Verificar si ya hay sesión activa
    if (sessionManager.isSessionActive()) {
      this.redirectToDashboard();
      return;
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Botones para cambiar entre login y registro
    const btnToRegister = document.getElementById('btn-to-register');
    const btnToLogin = document.getElementById('btn-to-login');

    if (btnToRegister) {
      btnToRegister.addEventListener('click', () => this.showRegisterForm());
    }
    if (btnToLogin) {
      btnToLogin.addEventListener('click', () => this.showLoginForm());
    }

    // Formularios
    const formLogin = document.getElementById('form-login');
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

    const correo = DomManager.getValue('login-email');
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

      // Guardar sesión
      sessionManager.saveSession(response.data.usuario, response.data.token);

      // Redirigir según tipo de usuario
      this.redirectToDashboard();

    } catch (error) {
      DomManager.showNotification(
        `Error: ${error.message}`,
        'error'
      );
    }
  }

  /**
   * Maneja el formulario de registro
   */
  async handleRegister(e) {
    e.preventDefault();

    const nombre_usuario = DomManager.getValue('register-username');
    const correo = DomManager.getValue('register-email');
    const contraseña = DomManager.getValue('register-password');
    const confirmar_contraseña = DomManager.getValue('register-confirm-password');
    const tipo_usuario = DomManager.getValue('register-type');

    // Validaciones
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

      const response = await apiManager.register({
        nombre_usuario,
        correo,
        contraseña,
        tipo_usuario
      });

      DomManager.showNotification('Registro exitoso. Inicia sesión.', 'success');

      // Mostrar formulario de login
      this.showLoginForm();

    } catch (error) {
      DomManager.showNotification(
        `Error: ${error.message}`,
        'error'
      );
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
   * Redirige al dashboard según tipo de usuario
   */
  redirectToDashboard() {
    const tipoUsuario = sessionManager.getUserType();
    
    if (tipoUsuario === 'asesor') {
      window.location.href = './dashboard-asesor.html';
    } else if (tipoUsuario === 'asesorado') {
      window.location.href = './dashboard-asesorado.html';
    } else {
      window.location.href = './index.html';
    }
  }
}

// Inicializar cuando carga el DOM
document.addEventListener('DOMContentLoaded', () => {
  new AuthModule();
});