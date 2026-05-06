import Inscripcion from '../models/Inscripcion.js';
import Asesoria from '../models/Asesoria.js'; 
import * as notificacionService from './notificaciones.service.js';

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
    estado: 'activa' 
  });

  // validación de si hay cupos (comparación de inscritos con el cupo máximo de la asesoría)
  if (inscritosActuales >= asesoria.cupo) {
    throw new Error('NO_VACANCIES'); // error de "no hay vacantes"
  }

  // si no hay problemas, se crea el nuevo registro de inscripción
  const nuevaInscripcion = new Inscripcion({
    usuarioId,
    asesoriaId,
    estado: 'activa'
  });

  // se crea la notificación de inscripción exitosa y se envía al asesorado correspondiente
  await notificacionService.crearNotificacion(
    usuarioId,
    '¡Te has inscrito a una asesoría!',
    `Te has inscrito exitosamente a la asesoría de "${asesoria.titulo}". ¡No olvides asistir en la fecha indicada!`,
    `/asesoria/${asesoriaId}`
  );

  // se guarda en la DB y se devuelve el resultado
  return await nuevaInscripcion.save();
};

// función para obtener todas las inscripciones de un asesorado
export const getInscripcionesPorAsesorado = async (usuarioId) => {
  // se devuelven las inscripciones (uso de "populate" para obtener también los detalles de la asesoría)
  return await Inscripcion.find({ usuarioId, estado: 'activa' }).populate('asesoriaId');
};

// función para cancelar una inscripción (cambia el estado a inactiva)
export const cancelarInscripcion = async (inscripcionId) => {
  const inscripcion = await Inscripcion.findByIdAndUpdate(
    inscripcionId, 
    { estado: 'inactiva' },
    { new: true } // devuelve el documento actualizado
  ).populate('asesoriaId'); // "populate" para saber el nombre de la clase

  // se crea la notificación de desinscripción de asesoría y se envía al asesorado correspondiente
  if (inscripcion) {
    await notificacionService.crearNotificacion(
      inscripcion.usuarioId,
      '¡Te has desinscrito de una asesoría!',
      `Has cancelado tu inscripción a "${inscripcion.asesoriaId.titulo}" exitosamente. Recuerda que aún podrás reinscribirte mientras exista cupo y estés dentro de la fecha límite.`,
      '/mis-asesorias'
    );
  }

  return inscripcion; // devuelve la inscripción actualizada
};