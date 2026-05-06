import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

    // Crear usuario (la contraseña se encripta automáticamente por el hook)
    const user = new User({
      nombre_usuario,
      correo,
      contraseña,
      tipo_usuario
    });

    await user.save();

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

    // Buscar usuario
    const user = await User.findOne({ correo });

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Comparar contraseña
    const isMatch = await bcrypt.compare(contraseña, user.contraseña);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generar token
    const token = jwt.sign(
      {
        id: user._id,
        tipo_usuario: user.tipo_usuario
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        usuario: {
          _id: user._id,
          tipo_usuario: user.tipo_usuario
        }
      }
    });

  } catch {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR'
    });
  }
};