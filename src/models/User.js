import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Define el esquema de usuario (estructura del documento en Mongo)
const userSchema = new mongoose.Schema({
  nombre_usuario: { type: String, required: true }, // Nombre del usuario
  correo: { type: String, required: true, unique: true }, // Email único
  contraseña: { type: String, required: true }, // Password (se encripta)
  tipo_usuario: { 
    type: String, 
    enum: ['asesor', 'asesorado'], // Solo estos valores permitidos
    required: true 
  }
});

// Hook de Mongoose: se ejecuta ANTES de guardar
userSchema.pre('save', async function () {

  // Si la contraseña no cambió, no hace nada
  if (!this.isModified('contraseña')) return;

  // Encripta la contraseña antes de guardarla
  this.contraseña = await bcrypt.hash(this.contraseña, 10);
});

// Exporta el modelo para usarlo en otros archivos
export default mongoose.model('User', userSchema);