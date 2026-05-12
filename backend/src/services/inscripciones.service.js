import Inscripcion from '../models/Inscripcion.js';
import Asesoria from '../models/Asesoria.js';
import * as notificacionService from './notificaciones.service.js';

// función para inscribir a un usuario en una asesoría
export const inscribirUsuario = async (usuarioId, asesoriaId) => {

  // se busca la asesoría para ver si existe y revisar el cupo
  // Poblamos la asignatura para poder usar su nombre en la notificación
  const asesoria = await Asesoria.findById(asesoriaId).populate('asignaturaId', 'nombre');
  if (!asesoria) {
    throw new Error('ASESORIA_NOT_FOUND');
  }

  // se cuenta cuántos asesorados están inscritos y activos
  const inscritosActuales = await Inscripcion.countDocuments({
    asesoriaId,
    estado: 'activa'
  });

  // validación de cupos
  if (inscritosActuales >= asesoria.cupo) {
    throw new Error('NO_VACANCIES');
  }

  // Buscamos si ya había un registro previo (activo o inactivo)
  let inscripcion = await Inscripcion.findOne({ usuarioId, asesoriaId });

  if (inscripcion) {
    // Si ya existe y está activa, bloqueamos
    if (inscripcion.estado === 'activa') {
      throw new Error('ALREADY_ENROLLED'); 
    }
    // Si estaba inactiva (cancelada previamente), la "revivimos"
    inscripcion.estado = 'activa';
  } else {
    // Si nunca se había inscrito, creamos una nueva
    inscripcion = new Inscripcion({
      usuarioId,
      asesoriaId,
      estado: 'activa'
    });
  }

  // Preparamos el nombre hermoso para la notificación (sin comillas raras)
  const nombreMateria = asesoria.asignaturaId ? asesoria.asignaturaId.nombre : 'Clase';

  // Notificación de inscripción exitosa
  await notificacionService.crearNotificacion(
    usuarioId,
    '¡Te has inscrito a una asesoría!',
    `Te has inscrito exitosamente a la asesoría de ${nombreMateria}: ${asesoria.descripcion}. ¡No olvides asistir en la fecha indicada!`,
    `/asesoria/${asesoriaId}`
  );

  // Notificación al asesor si se llena
  if (inscritosActuales + 1 === asesoria.cupo) {
    await notificacionService.crearNotificacion(
      asesoria.asesorId,
      '¡Asesoría Llena!',
      `Tu asesoría ha alcanzado su cupo máximo de ${asesoria.cupo} alumnos.`,
      `/asesoria/${asesoriaId}`
    );
  }

  // Guardamos (ya sea la nueva o la reactivada)
  return await inscripcion.save();
};

// función para obtener todas las inscripciones de un asesorado
export const getInscripcionesPorAsesorado = async (usuarioId) => {
  // se devuelven las inscripciones (uso de "populate" para obtener también los detalles de la asesoría)
  return await Inscripcion.find({ usuarioId, estado: 'activa' }).populate('asesoriaId');
};

// función para cancelar una inscripción (cambia el estado a inactiva)
export const cancelarInscripcion = async (inscripcionId) => {
  // Poblamos asesoriaId y anidamos la poblacion de asignaturaId para sacar el nombre de la materia
  const inscripcion = await Inscripcion.findByIdAndUpdate(
    inscripcionId,
    { estado: 'inactiva' },
    { new: true } // devuelve el documento actualizado
  ).populate({
    path: 'asesoriaId',
    populate: { path: 'asignaturaId', select: 'nombre' }
  });

  // se crea la notificación de desinscripción de asesoría y se envía al asesorado correspondiente
  if (inscripcion && inscripcion.asesoriaId) {
    const nombreClase = inscripcion.asesoriaId.asignaturaId ? inscripcion.asesoriaId.asignaturaId.nombre : 'la asesoría';
    await notificacionService.crearNotificacion(
      inscripcion.usuarioId,
      '¡Te has desinscrito de una asesoría!',
      `Has cancelado tu inscripción a la clase de ${nombreClase} exitosamente. Recuerda que aún podrás reinscribirte mientras exista cupo y estés dentro de la fecha límite.`,
      '/mis-asesorias'
    );
  }

  return inscripcion; // devuelve la inscripción actualizada
};