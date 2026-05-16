import * as asesoriaService from '../services/asesorias.service.js';

// Controlador para crear una nueva asesoría
export const crearAsesoria = async (req, res, next) => {
  try {
    // Validamos que el usuario sea de tipo asesor
    if (req.user.tipo_usuario !== 'asesor') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        error: 'Solo los asesores pueden crear asesorías'
      });
    }

    // El ID del asesor se obtiene del token (req.user.id)
    const asesorId = req.user.id;
    const nuevaAsesoria = await asesoriaService.crearAsesoria(asesorId, req.body);

    res.status(201).json({
      success: true,
      data: nuevaAsesoria
    });
  } catch (error) {
    if (error.message === 'PAST_DATE_ERROR') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        error: 'No se pueden registrar asesorías en fechas pasadas'
      });
    }
    if (error.message === 'SCHEDULE_CONFLICT') {
      return res.status(409).json({
        success: false,
        code: 'SCHEDULE_CONFLICT',
        error: 'Ya tienes una asesoría programada en ese horario'
      });
    }
    next(error);
  }
};

// Controlador para obtener todas las asesorías con filtros y paginación
export const getAsesorias = async (req, res, next) => {
  try {
    const filtros = {
      asignaturaId: req.query.asignaturaId,
      fecha: req.query.fecha,
      calificacionMin: req.query.calificacionMin ? Number(req.query.calificacionMin) : undefined
    };

    // Parámetros de paginación requeridos por la rúbrica
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;

    const asesorias = await asesoriaService.getAsesorias(filtros, page, limit);

    res.status(200).json({
      success: true,
      data: asesorias
    });
  } catch (error) {
    next(error);
  }
};

// Controlador para obtener las asesorías de un asesor específico
export const getAsesoriasPorAsesor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asesorias = await asesoriaService.getAsesoriasPorAsesor(id);

    res.status(200).json({
      success: true,
      data: asesorias
    });
  } catch (error) {
    next(error);
  }
};

// Controlador para obtener detalles de una asesoría específica
export const getAsesoriaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asesoria = await asesoriaService.getAsesoriaById(id, req.user?.id);

    if (!asesoria) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: asesoria
    });
  } catch (error) {
    next(error);
  }
};

// Controlador para editar una asesoría
export const editarAsesoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Primero, verificamos que la asesoría exista para poder revisar quién es su dueño
    const asesoriaExistente = await asesoriaService.getAsesoriaById(id);
    if (!asesoriaExistente) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND'
      });
    }

    // Validación de propiedad (Seguridad estricta)
    // El toString() es necesario porque asesorId viene como ObjectId de MongoDB
    if (asesoriaExistente.asesorId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Solo el creador puede modificar esta asesoría'
      });
    }
    
    // Si pasa la seguridad, la editamos
    const asesoriaEditada = await asesoriaService.editarAsesoria(id, req.body);

    res.status(200).json({
      success: true,
      data: { estado: 'actualizada' }
    });
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND'
      });
    }
    if (error.message === 'PAST_DATE_ERROR') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        error: 'No se puede reprogramar a una fecha pasada'
      });
    }
    next(error);
  }
};

// Controlador para cancelar (eliminar lógicamente) una asesoría
export const cancelarAsesoria = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Primero verificamos que exista
    const asesoriaExistente = await asesoriaService.getAsesoriaById(id);
    if (!asesoriaExistente) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND'
      });
    }

    // Validación de propiedad (Seguridad estricta)
    if (asesoriaExistente.asesorId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Solo el creador puede cancelar esta asesoría'
      });
    }

    // Si pasa la seguridad, la cancelamos
    const asesoriaCancelada = await asesoriaService.cancelarAsesoria(id);

    res.status(200).json({
      success: true,
      data: { estado: 'cancelado' }
    });
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND'
      });
    }
    next(error);
  }
};