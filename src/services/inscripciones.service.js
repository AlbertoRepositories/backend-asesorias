import Inscripcion from '../models/Inscripcion.js';
import Asesoria from '../models/Asesoria.js';
import * as notificacionService from './notificaciones.service.js';

// función para inscribir a un usuario en una asesoría
export const inscribirUsuario = async (usuarioId, asesoriaId) => {

  // se busca la asesoría para ver si existe y revisar el cupo
  // Poblamos la asignatura para poder usar su nombre en la notificación
  const asesoria = await Asesoria.findById(asesoriaId).populate('asignaturaId', 'nombre');
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

  const nombreMateria = asesoria.asignaturaId ? asesoria.asignaturaId.nombre : 'Clase';

  // se crea la notificación de inscripción exitosa y se envía al asesorado correspondiente
  await notificacionService.crearNotificacion(
    usuarioId,
    '¡Te has inscrito a una asesoría!',
    `Te has inscrito exitosamente a la asesoría de ${nombreMateria}: ${asesoria.descripcion}. ¡No olvides asistir en la fecha indicada!`,
    `/asesoria/${asesoriaId}`
  );

  // notificación al asesor si se llena la asesoría
  if (inscritosActuales + 1 === asesoria.cupo) {
    await notificacionService.crearNotificacion(
      asesoria.asesorId,
      '¡Asesoría Llena!',
      `Tu asesoría ha alcanzado su cupo máximo de ${asesoria.cupo} alumnos.`,
      `/asesoria/${asesoriaId}`
    );
  }

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