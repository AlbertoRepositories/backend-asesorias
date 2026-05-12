import mongoose from 'mongoose';

const notificacionSchema = new mongoose.Schema({
  // usuario que recibe la notificación
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // título corto de la notificación
  titulo: {
    type: String,
    required: true
  },
  // detalles de la notificación
  descripcion: {
    type: String,
    required: true
  },
  // estado (si ya fue leída o no por el usuario)
  leido: {
    type: Boolean,
    default: false
  },
  // enlace relacionado a la notificación para que el usuario pueda hacer clic y ser redirigido
  enlace: {
    type: String, 
    required: true
  },
  // Fecha de creación
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // para tener registro de cuándo se creó/editó
});

export default mongoose.model('Notificacion', notificacionSchema);