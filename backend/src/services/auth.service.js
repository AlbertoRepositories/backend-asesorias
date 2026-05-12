import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Función para registrar usuario
export const register = async (data) => {
  // Crea un nuevo usuario con los datos recibidos
  const user = new User(data);

  // Lo guarda en la base de datos
  return await user.save();
};

// Función para login
export const login = async (correo, contraseña) => {

  // Busca usuario por correo
  const user = await User.findOne({ correo });

  // Si no existe → error
  if (!user) throw new Error('INVALID_CREDENTIALS');

  // Compara contraseña ingresada vs la encriptada en DB
  const match = await bcrypt.compare(contraseña, user.contraseña);

  // Si no coincide → error
  if (!match) throw new Error('INVALID_CREDENTIALS');

  // Genera token JWT con id y rol del usuario
  const token = jwt.sign(
    { id: user._id, tipo_usuario: user.tipo_usuario }, // payload
    process.env.JWT_SECRET, // clave secreta
    { expiresIn: '1d' } // tiempo de vida
  );

  // Retorna token y datos del usuario
  return { token, user };
};