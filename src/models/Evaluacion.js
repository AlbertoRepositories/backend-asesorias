import mongoose from 'mongoose';

// Esquema de evaluación
const evaluacionSchema = new mongoose.Schema({

  // Referencia al asesor evaluado
  asesorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Referencia a la asesoría
  asesoriaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asesoria',
    required: true
  },

  // Calificación (1 a 5)
  calificacion: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  // Comentario opcional
  comentario: {
    type: String,
    maxlength: 500
  }

}, {
  timestamps: true // agrega createdAt automáticamente
});

// Evita que un usuario evalúe dos veces la misma asesoría
evaluacionSchema.index(
  { asesorId: 1, asesoriaId: 1 },
  { unique: true }
);

export default mongoose.model('Evaluacion', evaluacionSchema);