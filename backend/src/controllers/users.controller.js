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