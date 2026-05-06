import Inscripcion from '../models/Inscripcion.js';
// importación del modelo Asesoría para verificar el cupo
import Asesoria from '../models/Asesoria.js'; 

// función para inscribir a un usuario en una asesoría
export const inscribirUsuario = async (usuarioId, asesoriaId) => {
  
  // se busca la asesoría para ver si existe y revisar el cupo
  const asesoria = await Asesoria.findById(asesoriaId);
  if (!asesoria) {
    throw new Error('ASESORIA_NOT_FOUND'); // error de "asesoría no encontrada"
  }

  // se cuenta cuántos asesorados están inscritos y activos en la asesoría
  const inscritosActuales = await Inscripcion.countDocuments({ 
    asesoriaId, 
    estado_inscripcion: 'activa' 
  });

  // validación de si hay cupos (comparación de inscritos con el cupo máximo de la asesoría)
  if (inscritosActuales >= asesoria.cupo) {
    throw new Error('NO_VACANCIES'); // error de "no hay vacantes"
  }

  // si no hay problemas, se crea el nuevo registro de inscripción
  const nuevaInscripcion = new Inscripcion({
    usuarioId,
    asesoriaId,
    estado_inscripcion: 'activa'
  });

  // se guarda en la DB y se devuelve el resultado
  return await nuevaInscripcion.save();
};

// función para obtener todas las inscripciones de un asesorado
export const getInscripcionesPorAsesorado = async (usuarioId) => {
  // se devuelven las inscripciones (uso de "populate" para obtener también los detalles de la asesoría)
  return await Inscripcion.find({ usuarioId, estado_inscripcion: 'activa' })
    .populate('asesoriaId');
};

// función para cancelar una inscripción (cambia el estado a inactiva)
export const cancelarInscripcion = async (inscripcionId) => {
  return await Inscripcion.findByIdAndUpdate(
    inscripcionId, 
    { estado_inscripcion: 'inactiva' },
    { new: true } // devuelve el documento actualizado
  );
};