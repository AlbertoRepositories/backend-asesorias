import * as evaluacionService from '../services/evaluaciones.service.js';

// Crear evaluación
export const crearEvaluacion = async (req, res) => {
  try {
    const { asesorId, asesoriaId, calificacion, comentario } = req.body;

    // Validar campos
    if (!asesorId || !asesoriaId || !calificacion) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS'
      });
    }

    // Validar rol
    if (req.user.tipo_usuario !== 'asesorado') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN'
      });
    }

    // Validar rango de calificación
    if (calificacion < 1 || calificacion > 5) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_RATING'
      });
    }

    // Validar que esté inscrito
    const inscripcion = await evaluacionService.usuarioInscrito(
      req.user._id,
      asesoriaId
    );

    if (!inscripcion) {
      return res.status(400).json({
        success: false,
        code: 'NOT_ENROLLED'
      });
    }

    // Crear evaluación
    const evaluacion = await evaluacionService.crearEvaluacion({
      asesorId,
      asesoriaId,
      calificacion,
      comentario
    });

    res.status(201).json({
      success: true,
      data: evaluacion
    });

  } catch (error) {

    // Evitar duplicados
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        code: 'EVALUATION_ALREADY_SUBMITTED'
      });
    }

    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR'
    });
  }
};


// Obtener evaluaciones de un asesor
export const getEvaluacionesByAsesor = async (req, res) => {
  try {
    const { id_asesor } = req.params;

    const evaluaciones = await evaluacionService.getEvaluacionesByAsesor(id_asesor);

    res.status(200).json({
      success: true,
      data: evaluaciones
    });

  } catch {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR'
    });
  }
};