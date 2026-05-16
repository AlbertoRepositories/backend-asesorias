import * as notificacionService from '../services/notificaciones.service.js';

// se obtienen todas las notificaciones del usuario
export const obtenerNotificaciones = async (req, res) => {
  try {
    // se obtiene el ID del usuario del token dado por el middleware de autenticación
    const usuarioId = req.user.id;

    // se llama al service para obtener las notificaciones del usuario
    const notificaciones = await notificacionService.getNotificacionesPorUsuario(usuarioId);

    // se devuelven las notificaciones con un código de éxito
    res.status(200).json({
      success: true,
      data: notificaciones
    });
    // manejo de errores (error general del servidor)
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR'
    });
  }
};

// se marca una notificación como "leída" cuando el usuario la abre
export const marcarNotificacionLeida = async (req, res) => {
  try {
    // se obtiene el ID de la notificación de la URL
    const { id } = req.params;

    // se llama al service para marcar la notificación como leída
    const actualizada = await notificacionService.notificacionLeida(id);

    // se devuelve un mensaje de éxito y las notificaciones actualizadas
    res.status(200).json({
      success: true,
      data: actualizada
    });
    // manejo de errores (error general del servidor)
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR'
    });
  }
};