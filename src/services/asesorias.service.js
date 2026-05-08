import Asesoria from '../models/Asesoria.js';
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

// Función para obtener asesorías con filtros opcionales
export const getAsesorias = async (filtros) => {
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

  // Buscamos y poblamos los datos del asesor y la asignatura
  return await Asesoria.find(query)
    .populate('asesorId', 'nombre_usuario calificacion')
    .populate('asignaturaId', 'nombre');
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

  const asesoriaActualizada = await Asesoria.findByIdAndUpdate(
    asesoriaId,
    { descripcion, horario, duracionMin, cupo },
    { new: true, runValidators: true }
  );

  if (!asesoriaActualizada) {
    throw new Error('NOT_FOUND');
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

  // TODO: En el servicio de inscripciones se debería notificar a los asesorados inscritos
  
  return asesoria;
};

// Función para obtener detalles de una asesoría por ID
export const getAsesoriaById = async (id) => {
  return await Asesoria.findById(id)
    .populate('asesorId', 'nombre_usuario calificacion')
    .populate('asignaturaId', 'nombre');
};
