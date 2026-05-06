import Evaluacion from '../models/Evaluacion.js';
//import Inscripcion from '../models/Inscripcion.js'; DESCOMENTAR CUANDO ESTÉ HECHO EL MODELO DE INSCRIPCIÓN

// Crear evaluación
export const crearEvaluacion = async (data) => {
  const evaluacion = new Evaluacion(data);
  return await evaluacion.save();
};

// Obtener evaluaciones de un asesor
export const getEvaluacionesByAsesor = async (asesorId) => {
  return await Evaluacion.find({ asesorId });
};

// Validar si el usuario está inscrito en la asesoría
/* DESCOMENTAR CUANDO ESTÉ HECHO EL MODELO DE DESCRIPCIÓN
export const usuarioInscrito = async (userId, asesoriaId) => {
  return await Inscripcion.findOne({
    usuarioId: userId,
    asesoriaId: asesoriaId,
    estado_inscripcion: 'activa'
  });
}; */