/**
 * dashboardModule.js
 * gestiona la carga dinámica del dashboard según el rol del usuario
 * muestra sección de asesor O sección de asesorado, nunca ambas
 */

async function initDashboard() {
  const user = sessionManager.getUser();

  // si no hay sesión activa al cargar el dashboard,
  // se redirige al login en lugar de intentar llamar al backend sin cookie.
  if (!user) {
    console.warn('Sin sesión activa en dashboard. Redirigiendo...');
    window.location.href = 'index.html';
    return;
  }

  // se muestra el nombre del usuario en la bienvenida (si el elemento existe)
  const bienvenidaEl = document.getElementById('bienvenida-usuario');
  if (bienvenidaEl) {
    bienvenidaEl.textContent = `Bienvenido/a, ${user.nombre_usuario}`;
  }

  // se ocultan AMBAS secciones por defecto desde JS,
  // así el HTML puede tener las dos visibles para maquetación
  // sin que el usuario las vea antes de que se decida cuál mostrar.
  const seccionAsesor    = document.getElementById('seccion-asesor');
  const seccionAsesorado = document.getElementById('seccion-asesorado');

  if (seccionAsesor)    seccionAsesor.style.display    = 'none';
  if (seccionAsesorado) seccionAsesorado.style.display = 'none';

  if (user.tipo_usuario === 'asesor') {
    // -- VISTA DEL ASESOR --
    if (seccionAsesor) seccionAsesor.style.display = 'block';
    await cargarAsesoriasDelAsesor();
    await cargarNotificacionesDashboard('seccion-asesor');
  } else {
    // -- VISTA DEL ASESORADO --
    if (seccionAsesorado) seccionAsesorado.style.display = 'block';
    await cargarMisInscripciones();
    await cargarNotificacionesDashboard('seccion-asesorado');
  }
}

/**
 * se cargan las asesorías creadas por el asesor logueado.
 * las inyecta en la tabla #tabla-asesorias-asesor del HTML.
 * uso de GET /api/asesorias/asesor/:id
 */
async function cargarAsesoriasDelAsesor() {
  const tablaCuerpo = document.querySelector('#tabla-asesorias-asesor tbody');
  if (!tablaCuerpo) return;

  tablaCuerpo.innerHTML = '<tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

  try {
    const user     = sessionManager.getUser();
    const respuesta = await apiManager.get(`/asesorias/asesor/${user._id}`);

    if (!respuesta.success || respuesta.data.length === 0) {
      tablaCuerpo.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Aún no has creado asesorías.</td></tr>';
      return;
    }

    tablaCuerpo.innerHTML = respuesta.data.map(asesoria => {
      const fecha          = new Date(asesoria.horario).toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const nombreMateria  = asesoria.asignaturaId?.nombre || 'Sin materia';
      const estadoBadge    = {
        disponible: 'bg-success',
        lleno:      'bg-warning text-dark',
        cancelado:  'bg-danger',
        finalizada: 'bg-secondary'
      }[asesoria.estado] || 'bg-secondary';

      return `
        <tr id="fila-asesoria-${asesoria._id}">
          <td>${nombreMateria}</td>
          <td>${fecha}</td>
          <td>—</td>
          <td>${asesoria.cupo}</td>
          <td><span class="badge ${estadoBadge}">${asesoria.estado}</span></td>
          <td>
            <a href="registro_asesoria.html?id=${asesoria._id}" class="btn btn-sm btn-primary me-1">
              <i class="fas fa-edit"></i> Editar
            </a>
            <button class="btn btn-sm btn-danger"
                    onclick="confirmarCancelacionAsesoria('${asesoria._id}')">
              <i class="fas fa-times"></i> Cancelar
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    manejarErrorSesion(error, tablaCuerpo, 6);
  }
}

/**
 * se cargan las asesorías en las que está inscrito el asesorado logueado.
 * las inyecta en la tabla #tabla-inscripciones del HTML.
 * uso de GET /api/inscripciones/mis-asesorias
 */
async function cargarMisInscripciones() {
  const tablaCuerpo = document.querySelector('#tabla-inscripciones tbody');
  if (!tablaCuerpo) return;

  tablaCuerpo.innerHTML = '<tr><td colspan="4" class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

  try {
    const respuesta = await apiManager.getMyEnrollments();

    if (!respuesta.success || respuesta.data.length === 0) {
      tablaCuerpo.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No tienes asesorías agendadas.</td></tr>';
      return;
    }

    tablaCuerpo.innerHTML = respuesta.data.map(inscripcion => {
      const a = inscripcion.asesoriaId;
      if (!a) return '';

      const fecha         = new Date(a.horario).toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const nombreMateria = a.asignaturaId?.nombre        || 'Sin materia';
      const nombreAsesor  = a.asesorId?.nombre_usuario    || 'Asesor';

      return `
        <tr id="fila-${inscripcion._id}">
          <td>${nombreMateria}</td>
          <td>${fecha}</td>
          <td>${nombreAsesor}</td>
          <td>
            <button class="btn btn-sm btn-danger"
                    onclick="confirmarDesinscripcion('${inscripcion._id}')">
              <i class="fas fa-user-minus"></i> Desinscribirse
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    manejarErrorSesion(error, tablaCuerpo, 4);
  }
}

/**
 * se cargan las últimas 3 notificaciones no leídas para mostrarlas
 * en el mini-panel del dashboard (columna lateral).
 * uso de GET /api/notificaciones
 */
async function cargarNotificacionesDashboard(seccionId) {
  // se busca el contenedor de notificaciones DENTRO de la sección activa
  const seccion    = document.getElementById(seccionId);
  const contenedor = seccion?.querySelector('.lista-notificaciones-dashboard');
  if (!contenedor) return;

  contenedor.innerHTML = '<p class="text-muted small"><i class="fas fa-spinner fa-spin"></i> Cargando...</p>';

  try {
    const respuesta = await apiManager.getNotifications();

    if (!respuesta.success || respuesta.data.length === 0) {
      contenedor.innerHTML = '<p class="text-muted small">No tienes notificaciones nuevas.</p>';
      return;
    }

    // se muestran solo las 3 más recientes no leídas
    const noLeidas = respuesta.data.filter(n => !n.leido).slice(0, 3);

    if (noLeidas.length === 0) {
      contenedor.innerHTML = '<p class="text-muted small">Todo al día ✅</p>';
      return;
    }

    contenedor.innerHTML = noLeidas.map(n => `
      <p class="mb-2">
        🔔 <strong>${n.titulo}</strong><br>
        <small class="text-muted">${n.descripcion?.substring(0, 80)}...</small>
      </p>
    `).join('<hr class="my-2">');

  } catch (error) {
    // en el dashboard las notificaciones son opcionales; solo se loguea el error
    console.warn('No se pudieron cargar las notificaciones del dashboard:', error.message);
    if (contenedor) contenedor.innerHTML = '<p class="text-muted small">Sin notificaciones.</p>';
  }
}

/**
 * se cancela la asistencia del asesorado a una asesoría.
 * se elimina la fila de la tabla sin recargar la página (soft delete visual).
 * uso de DELETE /api/inscripciones/:id
 */
window.confirmarDesinscripcion = async (inscripcionId) => {
  if (!confirm('¿Seguro que quieres cancelar tu asistencia?')) return;

  try {
    const respuesta = await apiManager.cancelEnrollment(inscripcionId);

    if (respuesta.success) {
      // soft delete visual: eliminamos la fila sin recargar
      document.getElementById(`fila-${inscripcionId}`)?.remove();

      // si la tabla quedó vacía, mostrar mensaje
      const tablaCuerpo = document.querySelector('#tabla-inscripciones tbody');
      if (tablaCuerpo && tablaCuerpo.children.length === 0) {
        tablaCuerpo.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No tienes asesorías agendadas.</td></tr>';
      }

      alert('Te has desinscrito correctamente.');
    }
  } catch (error) {
    manejarErrorSesion(error, null, 0);
    if (!error.message.includes('401')) {
      alert('No se pudo procesar la cancelación.');
    }
  }
};

/**
 * se cancela una asesoría creada por el asesor.
 * uso de DELETE /api/asesorias/:id
 */
window.confirmarCancelacionAsesoria = async (asesoriaId) => {
  if (!confirm('¿Seguro que quieres cancelar esta asesoría? Todos los inscritos serán notificados.')) return;

  try {
    const respuesta = await apiManager.deleteAsesoria(asesoriaId);

    if (respuesta.success) {
      // soft delete visual
      document.getElementById(`fila-asesoria-${asesoriaId}`)?.remove();
      alert('Asesoría cancelada. Los inscritos han sido notificados.');
    }
  } catch (error) {
    manejarErrorSesion(error, null, 0);
    if (!error.message.includes('401')) {
      alert('No se pudo cancelar la asesoría.');
    }
  }
};

/**
 * maneja errores 401 (sesión expirada) de forma centralizada.
 * si el error NO es 401, muestra un mensaje genérico en la tabla.
 */
function manejarErrorSesion(error, tablaCuerpo, colspan) {
  if (error.message.includes('401')) {
    // Sesión expirada → limpiar datos locales y redirigir al login
    sessionManager.clearSession();
    alert('Tu sesión ha expirado. Por favor inicia sesión de nuevo.');
    window.location.href = 'index.html';
  } else if (tablaCuerpo && colspan > 0) {
    tablaCuerpo.innerHTML = `
      <tr>
        <td colspan="${colspan}" class="text-center text-danger">
          <i class="fas fa-exclamation-circle me-1"></i>
          Error al cargar los datos. Intenta recargar la página.
        </td>
      </tr>
    `;
  }
}

// se ejecuta al cargar el DOM
document.addEventListener('DOMContentLoaded', initDashboard);