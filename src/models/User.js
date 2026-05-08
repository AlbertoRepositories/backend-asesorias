import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Define el esquema de usuario (estructura del documento en Mongo)
const userSchema = new mongoose.Schema({
  nombre_usuario: { type: String, required: true }, // Nombre del usuario
   // Email único
   correo: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Correo inválido']
  },
  contraseña: { type: String, required: true, minlength: 6 }, // Password (se encripta)
  tipo_usuario: { 
    type: String, 
    enum: ['asesor', 'asesorado'], // Solo estos valores permitidos
    required: true 
  },
  calificacion: {
    type: Number,
    default: null
  }
});

// Hook de Mongoose: se ejecuta ANTES de guardar
userSchema.pre('save', async function () {
  // Si la contraseña no cambió, no hace nada
  if (!this.isModified('contraseña')) return;

  // Encripta la contraseña antes de guardarla
  const salt = await bcrypt.genSalt(10);
  this.contraseña = await bcrypt.hash(this.contraseña, salt);
});

// Exporta el modelo para usarlo en otros archivos
export default mongoose.model('User', userSchema);