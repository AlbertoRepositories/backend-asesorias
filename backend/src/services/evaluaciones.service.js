import Evaluacion from '../models/Evaluacion.js';
import Inscripcion from '../models/Inscripcion.js';
import User from '../models/User.js';

// Crear evaluación y actualizar calificación del asesor
export const crearEvaluacion = async (data) => {
  // Guarda la nueva evaluación
  const evaluacion = new Evaluacion(data);
  await evaluacion.save();

  // Calcula el nuevo promedio del asesor
  const evaluacionesDelAsesor = await Evaluacion.find({ asesorId: data.asesorId });
  const totalPuntos = evaluacionesDelAsesor.reduce((sum, ev) => sum + ev.calificacion, 0);
  const nuevoPromedio = totalPuntos / evaluacionesDelAsesor.length;

  // Actualiza al usuario (asesor)
  await User.findByIdAndUpdate(data.asesorId, { calificacion: nuevoPromedio });

  return evaluacion;
};

// Obtener evaluaciones de un asesor
export const getEvaluacionesByAsesor = async (asesorId) => {
  return await Evaluacion.find({ asesorId });
};

// Validar si el usuario está inscrito en la asesoría
export const usuarioInscrito = async (userId, asesoriaId) => {
  return await Inscripcion.findOne({
    usuarioId: userId,
    asesoriaId: asesoriaId,
    estado: 'activa'
  });
};