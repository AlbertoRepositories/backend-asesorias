import cron from 'node-cron';
import Asesoria from '../models/Asesoria.js';
import Inscripcion from '../models/Inscripcion.js';
import * as notificacionService from '../services/notificaciones.service.js';

// función con la lógica de revisión de asesorías sin asesorados inscritos
const revisarAsesoriasVacias = async () => {
  try {
    console.log('Cron: Iniciando revisión de asesorías sin inscritos...');

    const ahora = new Date();
    const veinticuatroHrs = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

    // se buscan las asesorías próximas y poblamos la asignatura para el texto bonito
    const asesoriasProximas = await Asesoria.find({
      horario: { $gte: ahora, $lte: veinticuatroHrs },
      estado: 'disponible'
    }).populate('asignaturaId', 'nombre');

    for (const asesoria of asesoriasProximas) {
      // se obtiene el total de usuarios inscritos a la asesoría (usando _id correcto)
      const totalInscritos = await Inscripcion.countDocuments({
        asesoriaId: asesoria._id,
        estado: 'activa'
      });

      // si hay 0 inscritos, se le manda una notificación al asesor
      if (totalInscritos === 0) {
        const nombreMateria = asesoria.asignaturaId ? asesoria.asignaturaId.nombre : 'Clase';
        
        await notificacionService.crearNotificacion(
          asesoria.asesorId,
          '¡Aún no hay inscritos en tu asesoría!',
          `¡Atención! Tu asesoría de ${nombreMateria}: ${asesoria.descripcion} se llevará a cabo en menos de 24 hrs y aún no hay inscritos. Considera cancelarla o modificar la fecha.`,
          `/asesoria/${asesoria._id}`
        );
        console.log(`Notificación enviada para la asesoría con ID ${asesoria._id}`);
      }
    }
    console.log('Revisión de asesorías sin inscritos completada.');
  } catch (error) {
    console.error('Error en el Cron Job:', error);
  }
};

export const initCron = () => {
  cron.schedule('0 * * * *', () => {
    revisarAsesoriasVacias();
  });
};