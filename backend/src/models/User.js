import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Define el esquema de usuario (estructura del documento en Mongo)
const userSchema = new mongoose.Schema({
  nombre_usuario: { type: String, required: true },
  correo: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Correo inválido']
  },
  contraseña: { type: String, required: true, minlength: 6 },
  tipo_usuario: {
    type: String,
    enum: ['asesor', 'asesorado'],
    required: true
  },
  calificacion: {
    type: Number,
    default: null
  },
  // campo para que los asesorados guarden sus materias de interés
  // cada id apunta a una asignatura del catálogo
  materias_interes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asignatura'
  }],
  // DOCUMENTO EMBEBIDO: Auditoría del sistema (Requisito de rúbrica).
  detalles_sistema: {
    cuenta_activa: { type: Boolean, default: true },
    fecha_registro_real: { type: Date, default: Date.now }
  }
});

// Hook de Mongoose: se ejecuta ANTES de guardar
userSchema.pre('save', async function () {
  if (!this.isModified('contraseña')) return;
  const salt = await bcrypt.genSalt(10);
  this.contraseña = await bcrypt.hash(this.contraseña, salt);
});

export default mongoose.model('User', userSchema);