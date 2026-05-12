import Asesoria from '../models/Asesoria.js';
import Inscripcion from '../models/Inscripcion.js';
import * as notificacionService from './notificaciones.service.js';

// Función para crear una nueva asesoría
export const crearAsesoria = async (asesorId, data) => {
  const { asignaturaId, descripcion, horario, duracionMin, cupo } = data;

  // Validación: No se puede registrar una asesoría en una fecha pasada
  if (new Date(horario) < new Date()) {
    throw new Error('PAST_DATE_ERROR');
  }

  // Validación de traslape: El horario no puede duplicarse para el mismo asesor
  // Se asume que no puede haber otra asesoría que inicie al mismo tiempo para el mismo asesor
  const conflicto = await Asesoria.findOne({
    asesorId,
    horario: new Date(horario),
    estado: { $ne: 'cancelado' }
  });

  if (conflicto) {
    throw new Error('SCHEDULE_CONFLICT');
  }

  // Creamos la instancia de la asesoría
  const nuevaAsesoria = new Asesoria({
    asesorId,
    asignaturaId,
    descripcion,
    horario,
    duracionMin: duracionMin || 120,
    cupo,
    estado: 'disponible'
  });

  // Guardamos en la base de datos
  const resultado = await nuevaAsesoria.save();

  // Generamos notificación de confirmación para el asesor
  await notificacionService.crearNotificacion(
    asesorId,
    'Asesoría creada',
    `Has creado exitosamente la asesoría para la fecha ${new Date(horario).toLocaleString()}`,
    `/asesoria/${resultado._id}`
  );

  return resultado;
};

// Función para obtener asesorías con filtros opcionales y paginación
export const getAsesorias = async (filtros, page = 1, limit = 8) => {
  const query = { estado: 'disponible' };

  if (filtros.asignaturaId) {
    query.asignaturaId = filtros.asignaturaId;
  }

  if (filtros.fecha) {
    // Filtro por fecha específica (inicio del día a fin del día)
    const inicio = new Date(filtros.fecha);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(filtros.fecha);
    fin.setHours(23, 59, 59, 999);
    query.horario = { $gte: inicio, $lte: fin };
  }

  // Calcular el salto para la paginación de Mongoose
  const skip = (page - 1) * limit;

  // Buscamos, aplicamos skip y limit, y poblamos los datos referenciados
  let asesorias = await Asesoria.find(query)
    .populate('asesorId', 'nombre_usuario calificacion')
    .populate('asignaturaId', 'nombre')
    .skip(skip)
    .limit(limit);

  // Filtro por calificación mínima (se procesa después de poblar al usuario)
  // Nota: un usuario inicia con calificacion 'null', solo lo mostramos si ya tiene evaluación y es >= al filtro.
  if (filtros.calificacionMin !== undefined) {
    asesorias = asesorias.filter(a => {
      if (a.asesorId && a.asesorId.calificacion !== null) {
        return a.asesorId.calificacion >= filtros.calificacionMin;
      }
      return false; // Se oculta si no tiene evaluaciones o su puntaje es menor
    });
  }

  return asesorias;
};

// Función para obtener las asesorías creadas por un asesor específico
export const getAsesoriasPorAsesor = async (asesorId) => {
  return await Asesoria.find({ asesorId }).populate('asignaturaId', 'nombre');
};

// Función para editar una asesoría existente
export const editarAsesoria = async (asesoriaId, data) => {
  const { descripcion, horario, duracionMin, cupo } = data;

  // Si se cambia el horario, validamos que no sea en el pasado
  if (horario && new Date(horario) < new Date()) {
    throw new Error('PAST_DATE_ERROR');
  }

  // Buscamos la asesoría antes de actualizar para comparar el horario
  const asesoriaPrevia = await Asesoria.findById(asesoriaId);
  if (!asesoriaPrevia) {
    throw new Error('NOT_FOUND');
  }

  const asesoriaActualizada = await Asesoria.findByIdAndUpdate(
    asesoriaId,
    { descripcion, horario, duracionMin, cupo },
    { new: true, runValidators: true }
  );

  // --- NOTIFICACIÓN POR REPROGRAMACIÓN ---
  // Si el horario cambió, notificamos a los alumnos inscritos
  if (horario && new Date(horario).getTime() !== new Date(asesoriaPrevia.horario).getTime()) {
    const inscripciones = await Inscripcion.find({ 
      asesoriaId: asesoriaId, 
      estado: 'activa' 
    });

    for (const inscripcion of inscripciones) {
      await notificacionService.crearNotificacion(
        inscripcion.usuarioId,
        'Asesoría reprogramada',
        `La asesoría a la que estás inscrito ha cambiado de horario. La nueva fecha es: ${new Date(horario).toLocaleString()}`,
        `/asesoria/${asesoriaId}`
      );
    }
  }

  return asesoriaActualizada;
};

// Función para cancelar una asesoría
export const cancelarAsesoria = async (asesoriaId) => {
  const asesoria = await Asesoria.findByIdAndUpdate(
    asesoriaId,
    { estado: 'cancelado' },
    { new: true }
  );

  if (!asesoria) {
    throw new Error('NOT_FOUND');
  }

  // Notificamos al asesor de la cancelación
  await notificacionService.crearNotificacion(
    asesoria.asesorId,
    'Asesoría cancelada',
    `Tu asesoría del ${new Date(asesoria.horario).toLocaleString()} ha sido cancelada.`,
    '/mis-asesorias'
  );

  // --- NOTIFICACIÓN A LOS ALUMNOS INSCRITOS ---
  // Buscamos todas las inscripciones activas para esta asesoría
  const inscripciones = await Inscripcion.find({ 
    asesoriaId: asesoria._id, 
    estado: 'activa' 
  });

  // Enviamos una notificación a cada alumno
  for (const inscripcion of inscripciones) {
    await notificacionService.crearNotificacion(
      inscripcion.usuarioId,
      'Asesoría cancelada',
      `La asesoría a la que estabas inscrito para el ${new Date(asesoria.horario).toLocaleString()} ha sido cancelada por el asesor.`,
      '/mis-inscripciones'
    );
    
    // Opcional: También podríamos marcar la inscripción como 'cancelada' o 'inactiva'
    inscripcion.estado = 'inactiva';
    await inscripcion.save();
  }
  
  return asesoria;
}

// Función para obtener detalles de una asesoría por ID
export const getAsesoriaById = async (id) => {
  return await Asesoria.findById(id)
    .populate('asesorId', 'nombre_usuario calificacion')
    .populate('asignaturaId', 'nombre');
};