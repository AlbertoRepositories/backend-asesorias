import Notificacion from '../models/Notificacion.js';

// función para crear una notificación
export const crearNotificacion = async (usuarioId, titulo, mensaje, enlace) => {
  const notificacion = new Notificacion({
    usuarioId,
    titulo,
    descripcion: mensaje,
    enlace,
    leido: false // las notificaciones se crean como no leídas
  });

  return await notificacion.save();
};

// función para que se devuelva la lista de notificaciones del usuario
export const getNotificacionesPorUsuario = async (usuarioId) => {
  // se devuelven las notificaciones del usuario ordenadas de más reciente a más antigua
  return await Notificacion.find({ usuarioId }).sort({ fechaCreacion: -1 });
};

// función para marcar una notificación como leída cuando el usuario la abre
export const notificacionLeida = async (notificacionId) => {
  return await Notificacion.findByIdAndUpdate(
    notificacionId,
    { leido: true },
    { new: true }
  );
};