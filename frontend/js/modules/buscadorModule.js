/**
 * buscadorModule.js
 * gestiona la búsqueda, filtrado y paginación de las asesorías disponibles
 */

// estado global del buscador
const estadoBusqueda = {
  page: 1,
  limit: 10,
  asignaturaId: '',
  calificacionMin: '',
  horario: '',
  disponibilidad: '',
  searchText: ''
};

async function initBuscador() {
  const user = sessionManager.getUser();

  // si no hay datos de usuario en storage, se redirige al login
  if (!user) {
    safeRedirect('index.html');
    return;
  }

  try {
    const sessionCheck = await apiManager.checkSession();
    if (!sessionCheck.valid) {
      console.warn('Token inválido o expirado. Redirigiendo al login.');
      sessionManager.clearSession();
      safeRedirect('index.html');
      return;
    }
    if (sessionCheck.offline) {
      console.warn('Backend no disponible; se continúa con sesión local.');
    }
  } catch (error) {
    console.warn('Error al verificar sesión en buscador:', error.message);
  }

  await cargarFiltroMaterias();

  // se restauran filtros guardados en sessionStorage
  const filtrosGuardados = sessionStorage.getItem('filtros_busqueda');
  if (filtrosGuardados) {
    try {
      const parsed = JSON.parse(filtrosGuardados);
      Object.assign(estadoBusqueda, parsed);
      aplicarValoresAInputs();
    } catch (_) { /* ignorar JSON malformado */ }
  }

  const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
  if (btnAplicarFiltros) btnAplicarFiltros.addEventListener('click', manejarFiltros);

  const formBuscador = document.getElementById('form-buscador');
  if (formBuscador) formBuscador.addEventListener('submit', manejarFiltros);

  await buscarAsesorias();
}

async function cargarFiltroMaterias() {
  const selectMateria = document.getElementById('filtro-materia');
  if (!selectMateria) return;

  try {
    const respuesta = await apiManager.get('/asignaturas');
    if (respuesta.success && Array.isArray(respuesta.data)) {
      respuesta.data.forEach(materia => {
        const option = document.createElement('option');
        option.value = materia._id;
        option.textContent = materia.nombre;
        selectMateria.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error al cargar materias:', error.message);
  }
}

async function manejarFiltros(evento) {
  if (evento) evento.preventDefault();

  estadoBusqueda.page = 1;
  estadoBusqueda.asignaturaId    = document.getElementById('filtro-materia')?.value        || '';
  estadoBusqueda.calificacionMin = document.getElementById('filtro-calificacion')?.value   || '';
  estadoBusqueda.horario         = document.getElementById('filtro-horario')?.value         || '';
  estadoBusqueda.disponibilidad  = document.getElementById('filtro-disponibilidad')?.value  || '';
  estadoBusqueda.searchText      = document.getElementById('search-term')?.value            || '';

  sessionStorage.setItem('filtros_busqueda', JSON.stringify(estadoBusqueda));
  await buscarAsesorias();
}

async function buscarAsesorias() {
  const contenedor = document.getElementById('contenedor-resultados');
  if (!contenedor) return;

  contenedor.innerHTML = '<div class="text-center w-100 py-5"><i class="fas fa-spinner fa-spin fa-3x"></i><p class="mt-3">Buscando asesorías...</p></div>';

  try {
    const params = {};
    if (estadoBusqueda.page)           params.page           = estadoBusqueda.page;
    if (estadoBusqueda.limit)          params.limit          = estadoBusqueda.limit;
    if (estadoBusqueda.asignaturaId)   params.asignaturaId   = estadoBusqueda.asignaturaId;
    if (estadoBusqueda.calificacionMin) params.calificacionMin = estadoBusqueda.calificacionMin;

    const respuesta = await apiManager.getAsesorias(params);

    if (respuesta.success && Array.isArray(respuesta.data) && respuesta.data.length > 0) {
      const asesoriasFiltradas = aplicarFiltrosAdicionales(respuesta.data);
      if (asesoriasFiltradas.length > 0) {
        renderizarTarjetas(asesoriasFiltradas);
        actualizarPaginacion(asesoriasFiltradas.length);
      } else {
        contenedor.innerHTML = '<div class="alert alert-info w-100 text-center">No se encontraron asesorías con esos filtros.</div>';
        actualizarPaginacion(0);
      }
    } else {
      contenedor.innerHTML = '<div class="alert alert-info w-100 text-center">No hay asesorías disponibles en este momento.</div>';
      actualizarPaginacion(0);
    }
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') {
      alert('Tu sesión ha expirado. Por favor inicia sesión de nuevo.');
      sessionManager.clearSession();
      safeRedirect('index.html');
      return;
    }
    if (error.message === 'NETWORK_ERROR') {
      contenedor.innerHTML = '<div class="alert alert-warning w-100 text-center"><i class="fas fa-exclamation-triangle me-2"></i>No se pudo conectar al servidor. Verifica que el backend esté corriendo.</div>';
      return;
    }
    contenedor.innerHTML = '<div class="alert alert-danger w-100">Error al cargar asesorías. Intenta recargar la página.</div>';
    console.error('Error en búsqueda de asesorías:', error.message);
  }
}

function aplicarValoresAInputs() {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };
  set('filtro-materia',        estadoBusqueda.asignaturaId);
  set('filtro-calificacion',   estadoBusqueda.calificacionMin);
  set('filtro-horario',        estadoBusqueda.horario);
  set('filtro-disponibilidad', estadoBusqueda.disponibilidad);
  set('search-term',           estadoBusqueda.searchText);
}

function aplicarFiltrosAdicionales(asesorias) {
  return asesorias.filter(as => {
    if (estadoBusqueda.searchText) {
      const texto = estadoBusqueda.searchText.trim().toLowerCase();
      const candidato = [
        as.asignaturaId?.nombre,
        as.asesorId?.nombre_usuario,
        as.descripcion
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!candidato.includes(texto)) return false;
    }

    if (estadoBusqueda.horario) {
      const hora = new Date(as.horario).getHours();
      if (estadoBusqueda.horario === 'Mañana' && hora >= 12) return false;
      if (estadoBusqueda.horario === 'Tarde'  && hora < 12)  return false;
    }

    if (estadoBusqueda.disponibilidad) {
      const estado = (as.estado || '').toLowerCase();
      if (estado !== estadoBusqueda.disponibilidad.toLowerCase()) return false;
    }

    return true;
  });
}

function actualizarPaginacion(total) {
  const paginacion = document.getElementById('paginacion-resultados');
  if (!paginacion) return;
  paginacion.textContent = total > 0
    ? `Mostrando ${Math.min(total, estadoBusqueda.limit)} de ${total} resultados.`
    : 'No hay resultados que coincidan con los filtros seleccionados.';
}

function renderizarTarjetas(asesorias) {
  const contenedor = document.getElementById('contenedor-resultados');
  contenedor.innerHTML = '';

  asesorias.forEach(as => {
    const rating = as.asesorId?.calificacion
      ? `⭐ ${as.asesorId.calificacion.toFixed(1)}`
      : 'Sin calificar';

    const card = `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card p-4 h-100">
          <div class="d-flex justify-content-between">
            <span class="badge bg-primary mb-2">${as.asignaturaId?.nombre || 'Materia desconocida'}</span>
            <span class="text-warning fw-bold">${rating}</span>
          </div>
          <h5 class="fw-bold">${(as.descripcion || '').substring(0, 80)}…</h5>
          <p class="mb-1"><strong>Asesor:</strong> ${as.asesorId?.nombre_usuario || 'Desconocido'}</p>
          <p class="mb-3"><strong>Fecha:</strong> ${new Date(as.horario).toLocaleDateString('es-MX')}</p>
          <button class="btn btn-primary mt-auto" onclick="verDetallesAsesoria('${as._id}')">
            Ver detalles
          </button>
        </div>
      </div>
    `;
    contenedor.innerHTML += card;
  });
}

window.verDetallesAsesoria = async (id) => {
  try {
    const respuesta = await apiManager.get(`/asesorias/${id}`);
    if (respuesta.success) {
      const as = respuesta.data;
      const horario = new Date(as.horario);

      document.getElementById('modal-titulo').textContent      = as.asignaturaId?.nombre || 'Asesoría';
      document.getElementById('modal-asesor').textContent      = as.asesorId?.nombre_usuario || 'Desconocido';
      document.getElementById('modal-descripcion').textContent = as.descripcion || 'Sin descripción';
      const inscritos = as.inscritosActuales || 0;
      const disponibles = as.cupo - inscritos;
      document.getElementById('modal-cupo').textContent        = `${disponibles} de ${as.cupo} lugares disponibles`;
      document.getElementById('modal-horario').textContent     = horario.toLocaleString('es-MX');
      document.getElementById('modal-fecha').textContent       = horario.toLocaleDateString('es-MX');
      document.getElementById('modal-hora').textContent        = horario.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      document.getElementById('modal-ubicacion').textContent   = as.ubicacion || as.enlace || as.link || as.lugar || as.direccion || 'Por definir';
      document.getElementById('modal-modalidad').textContent   = as.modalidad || as.tipo_modalidad || as.tipoModalidad || 'Por definir';
      document.getElementById('modal-cupo-detalle').textContent = `${disponibles} cupos disponibles`;

      const btnPerfil = document.getElementById('btn-ver-perfil');
      if (btnPerfil) {
        btnPerfil.href = `perfil_asesor.html?asesorId=${as.asesorId?._id || ''}&asesoriaId=${as._id}`;
      }

      const fin = new Date(horario.getTime() + ((as.duracionMin || 120) * 60000));
      const finEl = document.getElementById('modal-hora-fin');
      if (finEl) finEl.textContent = fin.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

      const btnInscribir = document.getElementById('btn-confirmar-inscripcion');
      if (btnInscribir) {
        btnInscribir.setAttribute('onclick', `ejecutarInscripcion('${as._id}')`);
        const yaInscrito = as.yaInscrito;
        btnInscribir.disabled = sessionManager.getUserType() === 'asesor' || yaInscrito;
        btnInscribir.textContent = yaInscrito ? 'Ya inscrito' : 'Inscribirme';
        btnInscribir.title = sessionManager.getUserType() === 'asesor'
          ? 'Los asesores no pueden inscribirse' : '';
      }

      // se configura el botón de seguimiento
      await configurarBotonSeguirModal(as.asesorId?._id);

      const myModal = new bootstrap.Modal(document.getElementById('modalDetalles'));
      myModal.show();
    }
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') {
      alert('Tu sesión ha expirado. Por favor inicia sesión de nuevo.');
      sessionManager.clearSession();
      safeRedirect('index.html');
      return;
    }
    alert('No se pudieron cargar los detalles de la asesoría.');
    console.error(error.message);
  }
};

/**
 * se configura el botón "seguir asesor" dentro del modal de detalles
 * se consulta si el usuario ya sigue al asesor y actualiza el botón en consecuencia
 * el listener se registra UNA sola vez usando un flag en el botón (data-listener-set),
 * y el estado actual siempre se lee desde data-siguiendo para evitar closures desactualizados
 */
async function configurarBotonSeguirModal(asesorId) {
  const btnSeguir = document.getElementById('btn-seguir-asesor');
  if (!btnSeguir) return;

  // Ocultar el botón para asesores (ellos no siguen a otros asesores)
  if (sessionManager.getUserType() === 'asesor') {
    btnSeguir.style.display = 'none';
    return;
  }

  btnSeguir.style.display = 'block';
  btnSeguir.disabled = true;
  btnSeguir.textContent = 'Cargando...';

  // se guarda el asesorId en el botón para que el listener pueda acceder a él
  btnSeguir.dataset.asesorId = asesorId || '';

  try {
    const respuesta = await apiManager.getAsesoresSeguidos();
    const yaSigue = (respuesta.data || []).some(a => a._id === asesorId);
    actualizarEstadoBotonSeguir(btnSeguir, yaSigue);
  } catch (error) {
    console.error('Error al verificar seguimiento:', error);
    btnSeguir.textContent = 'Seguir asesor';
    btnSeguir.className = 'btn btn-secondary';
  } finally {
    btnSeguir.disabled = false;
  }

  // se registra el listener solo una vez (evita acumulación de handlers al abrir el modal varias veces)
  if (!btnSeguir.dataset.listenerSet) {
    btnSeguir.dataset.listenerSet = 'true';
    btnSeguir.addEventListener('click', async () => {
      const currentAsesorId = btnSeguir.dataset.asesorId;
      if (!currentAsesorId) return;

      // se lee el estado actual desde el atributo
      const siguiendoActual = btnSeguir.dataset.siguiendo === 'true';
      btnSeguir.disabled = true;

      try {
        if (siguiendoActual) {
          await apiManager.dejarDeSeguirAsesor(currentAsesorId);
          actualizarEstadoBotonSeguir(btnSeguir, false);
          alert('Has dejado de seguir a este asesor.');
        } else {
          await apiManager.seguirAsesor(currentAsesorId);
          actualizarEstadoBotonSeguir(btnSeguir, true);
          alert('¡Ahora sigues a este asesor! Recibirás notificaciones de sus nuevas asesorías.');
        }
      } catch (error) {
        if (error.message === '400') {
          alert('No puedes seguirte a ti mismo o hay un problema con el asesor.');
        } else if (error.message === '403') {
          alert('Solo los asesorados pueden seguir asesores.');
        } else {
          alert('No se pudo actualizar el seguimiento. Intenta de nuevo.');
        }
        console.error('Error en seguimiento:', error);
      } finally {
        btnSeguir.disabled = false;
      }
    });
  }
}

function actualizarEstadoBotonSeguir(btn, yaSigue) {
  btn.dataset.siguiendo = yaSigue.toString();
  btn.textContent = yaSigue ? 'Dejar de seguir' : 'Seguir asesor';
  btn.className = yaSigue ? 'btn btn-outline-secondary' : 'btn btn-secondary';
}

window.ejecutarInscripcion = async (asesoriaId) => {
  if (!sessionManager.isSessionActive()) {
    alert('Debes iniciar sesión para inscribirte a una asesoría.');
    safeRedirect('index.html');
    return;
  }

  if (sessionManager.getUserType() === 'asesor') {
    alert('Los asesores no pueden inscribirse a asesorías.');
    return;
  }

  try {
    const respuesta = await apiManager.enrollInAsesoria(asesoriaId);
    if (respuesta.success) {
      alert('¡Inscripción exitosa! Revisa tu Dashboard.');
      window.location.reload();
    }
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') {
      alert('Tu sesión expiró. Por favor inicia sesión de nuevo.');
      sessionManager.clearSession();
      safeRedirect('index.html');
      return;
    }
    if (error.message === '400') alert('No hay cupo disponible o ya estás inscrito.');
    else if (error.message === '409') alert('Ya estás inscrito en esta asesoría.');
    else alert('Error al procesar la inscripción: ' + error.message);
  }
};

// Evita redirecciones múltiples simultáneas
function safeRedirect(url) {
  if (window._redirecting) return;
  window._redirecting = true;
  window.location.href = url;
}

document.addEventListener('DOMContentLoaded', initBuscador);