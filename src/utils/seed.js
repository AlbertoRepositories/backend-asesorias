import Asignatura from '../models/Asignatura.js';

// Función para inicializar de forma programática el catálogo de asignaturas.
// Esto garantiza que la BD cuenta con la información mínima necesaria desde su primer arranque.
export const seedAsignaturas = async () => {
  try {
    // Verifica si ya existen asignaturas en la colección
    const count = await Asignatura.countDocuments();
    
    if (count === 0) {
      console.log('No se encontraron asignaturas. Procediendo a precargar el catálogo base...');
      
      const asignaturasBase = [
        { nombre: 'Cálculo Integral', descripcion_asignatura: 'Estudio de integrales y sus aplicaciones' },
        { nombre: 'Cálculo Diferencial', descripcion_asignatura: 'Estudio de derivadas y tasas de cambio' },
        { nombre: 'Desarrollo Web', descripcion_asignatura: 'Creación y mantenimiento de aplicaciones web' },
        { nombre: 'Comunicación Oral y Escrita', descripcion_asignatura: 'Habilidades de expresión y redacción' },
        { nombre: 'Historia Universal', descripcion_asignatura: 'Estudio de los eventos históricos globales' },
        { nombre: 'Ecología', descripcion_asignatura: 'Estudio de las relaciones entre los seres vivos y su entorno' },
        { nombre: 'Programación Orientada a Objetos', descripcion_asignatura: 'Paradigma de programación basado en clases y objetos' },
        { nombre: 'Organización de Computadores', descripcion_asignatura: 'Estructura y funcionamiento interno de los sistemas computacionales' }
      ];

      await Asignatura.insertMany(asignaturasBase);
      console.log('✅ Catálogo de Asignaturas precargado exitosamente.');
    } else {
      console.log('ℹ️ El catálogo de Asignaturas ya cuenta con datos. No es necesario precargar.');
    }
  } catch (error) {
    console.error('❌ Error al precargar las asignaturas:', error);
  }
};