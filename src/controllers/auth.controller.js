import * as authService from '../services/auth.service.js';

// REGISTRO
export const register = async (req, res) => {
  try {
    const { nombre_usuario, correo, contraseña, tipo_usuario } = req.body;

    // Validar campos obligatorios
    if (!nombre_usuario || !correo || !contraseña || !tipo_usuario) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS'
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
        correo: user.correo
      }
    });

  } catch (error) {
    // Error de correo duplicado
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR'
    });
  }
};


// LOGIN
export const login = async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    // Validar campos
    if (!correo || !contraseña) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS'
      });
    }

    // Delegar validación y generación de token al servicio
    const result = await authService.login(correo, contraseña);

    res.status(200).json({
      success: true,
      data: {
        token: result.token,
        usuario: {
          _id: result.user._id,
          tipo_usuario: result.user.tipo_usuario
        }
      }
    });

  } catch (error) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS'
      });
    }

    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR'
    });
  }
};