import cron from 'node-cron';
import Asesoria from '../models/Asesoria.js';
import Inscripcion from '../models/Inscripcion.js';
import * as notificacionService from '../services/notificaciones.service.js';

// función con la lógica de revisión de asesorías sin asesorados inscritos
const revisarAsesoriasVacias = async () => {
  try {
    console.log('Cron: Iniciando revisión de asesorías sin inscritos...');

    // se define la fecha actual y la fecha en 24 hrs después para poder buscar asesorías en ese rango
    const ahora = new Date();
    const veinticuatroHrs = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

    // se buscan las asesorías que se vayan a realizar dentro de las próximas 24 horas y aún estén disponibles
    const asesoriasProximas = await Asesoria.find({
      horario: { $gte: ahora, $lte: veinticuatroHrs },
      estado: 'disponible'
    });

    for (const asesoria of asesoriasProximas) {
      // se obtiene el total de usuarios inscritos a la asesoría
      const totalInscritos = await Inscripcion.countDocuments({
        asesoriaId: asesoria.asesoriaId,
        estado: 'activa'
      });

      // si hay 0 inscritos, se le manda una notificación al asesor sugiriendo cancelarla
      if (totalInscritos === 0) {
        await notificacionService.crearNotificacion( // se crea la notificación para el asesor con los detalles
          asesoria.asesorId,
          '¡Aún no hay inscritos en tu asesoría!',
          `¡Atención! Tu asesoría de "${asesoria.titulo}" se llevará a cabo en menos de 24 hrs y aún no hay inscritos. Considera cancelarla o modificar la fecha.`,
          `/asesoria/${asesoria.asesoriaId}` // enlace para acceder a la asesoría en cuestión
        );
        console.log(`Notificación de aviso enviada al asesor de "${asesoria.titulo}" con ID de asesoría ${asesoria.asesoriaId}`); // mensaje informativo en consola de que se envió la notificación
      }
    }
    // mensaje informativo en consola de que finalizó el proceso con normalidad
    console.log('Revisión de asesorías sin inscritos completada.');
    // mensaje informativo en consola en caso de que fallara el proceso programado
  } catch (error) {
    console.error('Error en el Cron Job de revisión de asesorías sin inscritos:', error);
  }
};

// cuándo iniciar el cron job y la función a ejecutar
export const initCron = () => {
  cron.schedule('0 * * * *', () => { // programada para ocurrir cada hora exacta
    revisarAsesoriasVacias(); // se ejecuta la función de revisión
  });
};