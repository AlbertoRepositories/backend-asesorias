import mongoose from 'mongoose';

// Definición del esquema para la colección de Asesoría
const asesoriaSchema = new mongoose.Schema({
  // Referencia a la asignatura que se impartirá
  asignaturaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asignatura',
    required: true
  },
  // Explicación breve del contenido de la asesoría
  descripcion: {
    type: String,
    required: true,
    minlength: 30,
    maxlength: 600
  },
  // Fecha y hora en que se realizará la asesoría
  horario: {
    type: Date,
    required: true
  },
  // Duración estimada de la asesoría en minutos
  duracionMin: {
    type: Number,
    default: 120
  },
  // Número máximo de usuarios que pueden inscribirse
  cupo: {
    type: Number,
    required: true,
    min: 1
  },
  // Indica el estado actual de la asesoría
  estado: {
    type: String,
    enum: ['disponible', 'lleno', 'cancelado', 'finalizada'],
    default: 'disponible'
  },
  // Referencia al usuario (asesor) que imparte la asesoría
  asesorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  // Agrega campos createdAt y updatedAt automáticamente
  timestamps: true
});

// Crea el modelo a partir del esquema
const Asesoria = mongoose.model('Asesoria', asesoriaSchema);

export default Asesoria;
