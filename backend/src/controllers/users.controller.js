import User from '../models/User.js';

// PATCH /api/users/materias-interes
// actualiza la lista de materias de interés del asesorado autenticado.
export const actualizarMateriasInteres = async (req, res) => {
  try {
    // solo los asesorados tienen materias de interés
    if (req.user.tipo_usuario !== 'asesorado') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Solo los asesorados pueden gestionar materias de interés'
      });
    }

    const { materias_interes } = req.body;

    if (!Array.isArray(materias_interes)) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'materias_interes debe ser un arreglo de IDs'
      });
    }

    const usuarioActualizado = await User.findByIdAndUpdate(
      req.user.id,
      { materias_interes },
      { new: true }
    ).populate('materias_interes', 'nombre');

    res.status(200).json({
      success: true,
      data: {
        materias_interes: usuarioActualizado.materias_interes
      }
    });

  } catch (error) {
    console.error('Error al actualizar materias de interés:', error);
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR'
    });
  }
};

// GET /api/users/me — datos del usuario autenticado con materias pobladas
export const getMe = async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id)
      .populate('materias_interes', 'nombre')
      .select('-contraseña -detalles_sistema');

    if (!usuario) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    }

    res.status(200).json({ success: true, data: usuario });

  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR' });
  }
};

// GET /api/users/:id — devuelve el perfil público de un usuario con campos seguros
// esto permite actualizar el nombre y calificación del asesor después de una evaluación
// no necesita auth para que el frontend no quede bloqueado
export const getById = async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id)
      .select('nombre_usuario tipo_usuario calificacion');

    if (!usuario) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    }

    res.status(200).json({ success: true, data: usuario });

  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR' });
  }
};

// POST /api/users/seguir/:asesorId — el asesorado sigue a un asesor
export const seguirAsesor = async (req, res) => {
  try {
    // solo los asesorados pueden seguir asesores
    if (req.user.tipo_usuario !== 'asesorado') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'solo los asesorados pueden seguir asesores'
      });
    }

    const { asesorId } = req.params;
    const usuarioId = req.user.id;

    // validar que el asesor existe y es un asesor
    const asesor = await User.findById(asesorId);
    if (!asesor || asesor.tipo_usuario !== 'asesor') {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'asesor no encontrado'
      });
    }

    // agregar a la lista de asesores seguidos si no está ya
    const usuarioActualizado = await User.findByIdAndUpdate(
      usuarioId,
      { $addToSet: { asesores_seguidos: asesorId } },
      { new: true }
    ).populate('asesores_seguidos', 'nombre_usuario calificacion');

    res.status(200).json({
      success: true,
      data: usuarioActualizado.asesores_seguidos
    });

  } catch (error) {
    console.error('error al seguir asesor:', error);
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR'
    });
  }
};

// DELETE /api/users/seguir/:asesorId — el asesorado deja de seguir a un asesor
export const dejarDeSeguirAsesor = async (req, res) => {
  try {
    if (req.user.tipo_usuario !== 'asesorado') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'solo los asesorados pueden dejar de seguir asesores'
      });
    }

    const { asesorId } = req.params;
    const usuarioId = req.user.id;

    // remover de la lista de asesores seguidos
    const usuarioActualizado = await User.findByIdAndUpdate(
      usuarioId,
      { $pull: { asesores_seguidos: asesorId } },
      { new: true }
    ).populate('asesores_seguidos', 'nombre_usuario calificacion');

    res.status(200).json({
      success: true,
      data: usuarioActualizado.asesores_seguidos
    });

  } catch (error) {
    console.error('error al dejar de seguir asesor:', error);
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR'
    });
  }
};

// GET /api/users/asesores-seguidos — obtiene la lista de asesores que sigue el asesorado
export const getAsesoresSeguidos = async (req, res) => {
  try {
    const usuario = await User.findById(req.user.id)
      .select('asesores_seguidos')
      .populate('asesores_seguidos', 'nombre_usuario calificacion correo');

    if (!usuario) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    }

    res.status(200).json({
      success: true,
      data: usuario.asesores_seguidos || []
    });

  } catch (error) {
    console.error('error al obtener asesores seguidos:', error);
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR'
    });
  }
};