import * as authService from '../services/auth.service.js';

// Controller para registro
export const register = async (req, res) => {
  try {
    // Llama al service con los datos del body
    const user = await authService.register(req.body);

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      data: user
    });

  } catch (error) {

    // Error de validación (ej. email duplicado)
    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR'
    });
  }
};

// Controller para login
export const login = async (req, res) => {
  try {
    // Extrae datos del body
    const { correo, contraseña } = req.body;

    // Llama al service
    const data = await authService.login(correo, contraseña);

    // Respuesta exitosa con token
    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    // Credenciales inválidas
    res.status(401).json({
      success: false,
      code: 'INVALID_CREDENTIALS'
    });
  }
};