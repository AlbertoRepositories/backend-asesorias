/**
 * dashboardModule.js
 * gestiona la carga dinámica del dashboard según el rol del usuario
 */

async function initDashboard() {
  const user = sessionManager.getUser();

  if (!user) {
    console.warn('Sin sesión activa en dashboard. Redirigiendo...');
    window.location.href = 'index.html';
    return;
  }

  const bienvenidaEl = document.getElementById('bienvenida-usuario');
  if (bienvenidaEl) {
    bienvenidaEl.textContent = `Bienvenido/a, ${user.nombre_usuario}`;
  }

  const seccionAsesor    = document.getElementById('seccion-asesor');
  const seccionAsesorado = document.getElementById('seccion-asesorado');

  if (seccionAsesor)    seccionAsesor.style.display    = 'none';
  if (seccionAsesorado) seccionAsesorado.style.display = 'none';

  if (user.tipo_usuario === 'asesor') {
    if (seccionAsesor) seccionAsesor.style.display = 'block';
    await cargarAsesoriasDelAsesor();
    await cargarNotificacionesDashboard('seccion-asesor');
  } else {
    if (seccionAsesorado) seccionAsesorado.style.display = 'block';
    await cargarMisInscripciones();
    await cargarNotificacionesDashboard('seccion-asesorado');
    // cargar materias de interés del asesorado
    await cargarMateriasInteres();
  }
}

/**
 * se cargan las asesorías creadas por el asesor logueado.
 * las inyecta en la tabla #tabla-asesorias-asesor del HTML.
 * uso de GET /api/asesorias/asesor/:id
 */
// ASESOR: sus asesorías
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
      const fecha = new Date(asesoria.horario).toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const nombreMateria = asesoria.asignaturaId?.nombre || 'Sin materia';
      const estadoBadge   = {
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
// asesorado: sus inscripciones
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

      const fecha = new Date(a.horario).toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const nombreMateria = a.asignaturaId?.nombre     || 'Sin materia';
      const nombreAsesor  = a.asesorId?.nombre_usuario || 'Asesor';
      const asesorId      = a.asesorId?._id            || '';

      return `
        <tr id="fila-${inscripcion._id}">
          <td>${nombreMateria}</td>
          <td>${fecha}</td>
          <td>
            ${asesorId
              ? `<a href="perfil_asesor.html?id=${asesorId}&asesoriaId=${a._id}" class="text-primary">${nombreAsesor}</a>`
              : nombreAsesor
            }
          </td>
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
// ASESORADO: materias de interés

// estado local de las materias seleccionadas en el modal
let _todasLasMaterias    = [];  // catálogo completo de asignaturas
let _materiasSeleccionadas = []; // IDs actualmente guardados

async function cargarMateriasInteres() {
  const contenedor = document.getElementById('contenedor-materias-interes');
  if (!contenedor) return;

  try {
    // se cargan los datos del usuario (con materias_interes)
    const respMe = await apiManager.getMe();
    if (!respMe.success) return;

    const materiasGuardadas = respMe.data.materias_interes || [];
    _materiasSeleccionadas  = materiasGuardadas.map(m => m._id || m);

    renderizarMateriasInteres(materiasGuardadas, contenedor);

  } catch (error) {
    console.warn('No se pudieron cargar las materias de interés:', error.message);
    contenedor.innerHTML = '<p class="text-muted small">No disponible.</p>';
  }
}

function renderizarMateriasInteres(materias, contenedor) {
  if (materias.length === 0) {
    contenedor.innerHTML = `
      <p class="text-muted small mb-2">Aún no has seleccionado materias de interés.</p>
    `;
  } else {
    contenedor.innerHTML = materias.map(m =>
      `<span class="badge bg-primary me-1 mb-1">${m.nombre || m}</span>`
    ).join('');
  }
}

// se abre el modal de materias de interés y carga el catálogo de asignaturas
window.abrirModalMateriasInteres = async function () {
  const lista = document.getElementById('lista-materias-modal');
  if (!lista) return;

  lista.innerHTML = '<div class="text-center py-3"><i class="fas fa-spinner fa-spin"></i> Cargando materias...</div>';

  // Abrir el modal de Bootstrap
  const modal = new bootstrap.Modal(document.getElementById('modalMateriasInteres'));
  modal.show();

  try {
    // se cargar el catálogo de asignaturas si aún no se tiene
    if (_todasLasMaterias.length === 0) {
      const respAsig = await apiManager.get('/asignaturas');
      _todasLasMaterias = respAsig.success ? respAsig.data : [];
    }

    // se construyen los checkboxes
    lista.innerHTML = _todasLasMaterias.map(materia => {
      const checado = _materiasSeleccionadas.includes(materia._id) ? 'checked' : '';
      return `
        <div class="form-check mb-2">
          <input class="form-check-input materia-checkbox" type="checkbox"
                 value="${materia._id}" id="mat-${materia._id}" ${checado}>
          <label class="form-check-label" for="mat-${materia._id}">
            ${materia.nombre}
            ${materia.descripcion_asignatura
              ? `<small class="text-muted d-block">${materia.descripcion_asignatura}</small>`
              : ''}
          </label>
        </div>
      `;
    }).join('');

  } catch (error) {
    lista.innerHTML = '<p class="text-danger">Error al cargar las materias. Intenta de nuevo.</p>';
    console.error(error);
  }
};

// Guarda las materias seleccionadas en el modal
window.guardarMateriasInteres = async function () {
  const checkboxes = document.querySelectorAll('.materia-checkbox:checked');
  const nuevosIds  = Array.from(checkboxes).map(cb => cb.value);

  const btnGuardar = document.getElementById('btn-guardar-materias');
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Guardando...';
  }

  try {
    const respuesta = await apiManager.updateMateriasInteres(nuevosIds);

    if (respuesta.success) {
      // se actualiza el estado local
      _materiasSeleccionadas = nuevosIds;

      // se cierra el modal
      const modalEl = document.getElementById('modalMateriasInteres');
      bootstrap.Modal.getInstance(modalEl)?.hide();

      // se renderiza la lista en el dashboard usando los nombres del catálogo
      const materiasConNombre = _todasLasMaterias.filter(m => nuevosIds.includes(m._id));
      const contenedor = document.getElementById('contenedor-materias-interes');
      if (contenedor) renderizarMateriasInteres(materiasConNombre, contenedor);

      alert('¡Materias de interés actualizadas!');
    }
  } catch (error) {
    alert('Error al guardar las materias: ' + error.message);
    console.error(error);
  } finally {
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = '<i class="fas fa-save me-1"></i>Guardar';
    }
  }
};

// notificaciones en el mini-panel del dashboard
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
        <small class="text-muted">${(n.descripcion || '').substring(0, 80)}...</small>
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

document.addEventListener('DOMContentLoaded', initDashboard);