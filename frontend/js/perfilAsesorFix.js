
// Corrección de perfil_asesor.html

document.addEventListener('DOMContentLoaded', async () => {

  const params = new URLSearchParams(window.location.search);

  const asesorId = params.get('asesorId');
  const asesoriaId = params.get('asesoriaId');

  if (!asesorId || !asesoriaId) {
    return;
  }

  try {

    const response = await apiManager.get(`/evaluaciones/asesor/${asesorId}`);

    // cargar datos visuales del asesor
    const nombreEl = document.getElementById('nombre-asesor');
    const correoEl = document.getElementById('correo-asesor');

    // intentar obtener datos del asesor desde asesorías
    const asesorias = await apiManager.get(`/asesorias/asesor/${asesorId}`);

    if (asesorias.success && asesorias.data.length > 0) {

      const asesor = asesorias.data[0].asesorId;

      if (nombreEl) {
        nombreEl.textContent = asesor.nombre_usuario || 'Asesor';
      }

      if (correoEl) {
        correoEl.textContent = asesor.correo || '';
      }
    }

    const form = document.getElementById('form-evaluacion');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const calificacion = document.getElementById('calificacion').value;
        const comentario = document.getElementById('comentario').value;

        try {

          const resultado = await apiManager.post('/evaluaciones', {
            asesorId,
            asesoriaId,
            calificacion,
            comentario
          });

          if (resultado.success) {
            alert('Evaluación enviada correctamente');
            form.reset();
          }

        } catch (error) {
          alert(error.message || 'No se pudo enviar la evaluación');
        }
      });
    }

  } catch (error) {
    console.error(error);
  }

});
