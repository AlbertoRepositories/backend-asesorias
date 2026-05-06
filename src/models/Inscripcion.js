import mongoose from 'mongoose';

const inscripcionSchema = new mongoose.Schema({
  // usuario que se inscribe (de tipo 'asesorado')
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // referencia a la asesoría
  asesoriaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asesoria',
    required: true
  },
  // fecha y hora del registro de la inscripción
  fecha_inscripcion: {
    type: Date,
    default: Date.now
  },
  // estado: activa o inactiva (en caso de cancelarla)
  estado_inscripcion: {
    type: String,
    enum: ['activa', 'inactiva'],
    default: 'activa'
  }
}, {
  timestamps: true // para tener registro de cuándo se creó/editó
});

// esto evita que un usuario se inscriba dos veces a la misma asesoría !!
inscripcionSchema.index({ usuarioId: 1, asesoriaId: 1 }, { unique: true });

export default mongoose.model('Inscripcion', inscripcionSchema);