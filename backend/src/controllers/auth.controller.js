import * as authService from '../services/auth.service.js';
import { cookieOptions, cookieOptionsDev } from '../config/cookieConfig.js';

// REGISTRO
export const register = async (req, res) => {
  try {
    const { nombre_usuario, correo, contraseña, tipo_usuario } = req.body;

    // Validar campos obligatorios (express-validator ya lo hace, pero redundancia defensiva)
    if (!nombre_usuario || !correo || !contraseña || !tipo_usuario) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'Todos los campos son requeridos'
      });
    }

    // Delegar la creación del usuario a la capa de servicio (Arquitectura limpia)
    const user = await authService.register(req.body);

    // Respuesta sin contraseña
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        nombre_usuario: user.nombre_usuario,
        correo: user.correo,
        tipo_usuario: user.tipo_usuario
      },
      message: 'Usuario registrado correctamente'
    });

  } catch (error) {

    // Error de correo duplicado (Validación de MongoDB)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'El correo ya está registrado en el sistema'
      });
    }

    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Error al registrar el usuario'
    });
  }
};


// LOGIN
export const login = async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    // Validar campos (express-validator ya lo hace)
    if (!correo || !contraseña) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'Correo y contraseña son requeridos'
      });
    }

    // Delegar validación y generación de token al servicio
    const result = await authService.login(correo, contraseña);

    // Determinar opciones de cookie según el ambiente
    const options = process.env.NODE_ENV === 'production' ? cookieOptions : cookieOptionsDev;

    // Guardar el token en una cookie httpOnly
    res.cookie('authToken', result.token, options);

    // Respuesta con datos del usuario (NO incluir token en JSON)
    // Respuesta con datos del usuario Y el token (ahora se envía en JSON)
    res.status(200).json({
      success: true,
      data: {
        token: result.token,
        usuario: {
          _id: result.user._id,
          nombre_usuario: result.user.nombre_usuario,
          correo: result.user.correo,
          tipo_usuario: result.user.tipo_usuario
        }
      },
      message: 'Sesión iniciada correctamente'
    });

  } catch (error) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Correo o contraseña incorrectos'
      });
    }

    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Error al iniciar sesión'
    });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {
    // Limpiar la cookie del token con las mismas opciones con que se creó
    // (sin maxAge — clearCookie lo ignora de todas formas)
    const options = process.env.NODE_ENV === 'production' ? cookieOptions : cookieOptionsDev;
    const { maxAge, ...clearOptions } = options;
    res.clearCookie('authToken', clearOptions);

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Error al cerrar sesión'
    });
  }
};