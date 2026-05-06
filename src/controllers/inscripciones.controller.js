import * as inscripcionService from '../services/inscripciones.service.js';

// función para inscribir a un asesorado en una asesoría
export const inscribir = async (req, res) => {
  try {
    // se obtiene el ID de la asesoría del body del request
    const { asesoriaId } = req.body;
    // se saca el ID del usuario del token dado por el middleware de autenticación
    const usuarioId = req.user.id;

    // se llama al service para realizar la inscripción
    const inscripcion = await inscripcionService.inscribirUsuario(usuarioId, asesoriaId);

    // respuesta de éxito (creado) y se devuelve la inscripción creada
    res.status(201).json({
      success: true,
      data: inscripcion
    });

  } catch (error) {
    // si hubo error de "no hay vacantes", se devuelve un error con un mensaje
    if (error.message === 'NO_VACANCIES') {
      return res.status(400).json({
        success: false,
        code: 'NO_VACANCIES',
        message: '¡Ups! Ya no hay cupos disponibles para esta asesoría.'
      });
    }

    // error general del servidor si no hubo un error específico
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR'
    });
  }
};

// función para ver las asesorías en las que está inscrito el asesorado
export const listarInscripciones = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const lista = await inscripcionService.getInscripcionesPorAsesorado(usuarioId);

    res.status(200).json({
      success: true,
      data: lista
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR'
    });
  }
};