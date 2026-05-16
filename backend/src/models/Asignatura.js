import mongoose from 'mongoose';

// Definición del esquema para la colección de Asignatura (Catálogo)
const asignaturaSchema = new mongoose.Schema({
  // Nombre de la asignatura (ej. Cálculo Integral)
  nombre: {
    type: String,
    required: true,
    unique: true
  },
  // Descripción opcional para la materia
  descripcion_asignatura: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

const Asignatura = mongoose.model('Asignatura', asignaturaSchema);

export default Asignatura;
