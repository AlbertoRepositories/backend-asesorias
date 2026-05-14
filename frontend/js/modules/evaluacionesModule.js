// ============================================================
// evaluacionesModule.js — lógica para perfil.html
// Detecta automáticamente 4 situaciones:
//   1. Mi propio perfil → soy asesor
//   2. Mi propio perfil → soy asesorado
//   3. Perfil ajeno    → es asesor  (puedo evaluarlo)
//   4. Perfil ajeno    → es asesorado
// ============================================================

let calificacionSeleccionada = 0;  // Estrellas seleccionadas en el formulario
let asesorIdActual   = null;        // ID del perfil que se está mostrando
let asesoriaIdEval   = null;        // ID de asesoría a evaluar (URL: ?asesoriaId=)
let esMiPerfil       = false;       // ¿Estoy viendo mi propio perfil?
let tipoPerfilVisto  = null;        // 'asesor' | 'asesorado' del perfil mostrado

// ── INICIO ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  // CORRECCIÓN: Si no hay sesión activa, redirigir al login.
  // Antes no había esta verificación, causando llamadas al backend sin cookie
  // y errores de conexión confusos en la interfaz.
  if (!sessionManager.isSessionActive()) {
    console.warn('Sin sesión activa. Redirigiendo al login...');
    window.location.href = 'index.html';
    return;
  }

  // Leer parámetros de la URL
  // Ejemplos:
  //   perfil.html              → mi propio perfil
  //   perfil.html?id=abc       → perfil de otro usuario
  //   perfil.html?id=abc&asesoriaId=xyz → perfil + evaluar asesoría específica
  const params   = new URLSearchParams(window.location.search);
  const idEnURL  = params.get('id');
  asesoriaIdEval = params.get('asesoriaId');

  const usuarioLocal = sessionManager.getUser();

  if (idEnURL) {
    // Viene con ?id= → perfil de alguien (puede ser el propio)
    asesorIdActual = idEnURL;
    esMiPerfil     = usuarioLocal && (usuarioLocal._id === idEnURL);
  } else if (usuarioLocal) {
    // Sin ?id= → mi propio perfil
    asesorIdActual = usuarioLocal._id;
    esMiPerfil     = true;
  }

  if (!asesorIdActual) {
    mostrarEstadoVacio();
    return;
  }

  // Si es mi propio perfil, ya tenemos los datos en sesión → mostrar inmediato
  if (esMiPerfil && usuarioLocal) {
    tipoPerfilVisto = usuarioLocal.tipo_usuario;
    renderizarPerfil(usuarioLocal.nombre_usuario, tipoPerfilVisto, usuarioLocal.calificacion);
  }

  // Cargar contenido desde el backend según el tipo de perfil detectado
  cargarContenidoPerfil();
});

// ── RENDERIZAR PERFIL ─────────────────────────────────────────
function renderizarPerfil(nombre, tipo, calificacion) {
  tipoPerfilVisto = tipo;

  const avatarEl = document.getElementById('avatarInicial');
  if (avatarEl) {
    avatarEl.textContent = nombre ? nombre.charAt(0).toUpperCase() : '?';
    avatarEl.className   = `profile-avatar ${tipo || 'unknown'}`;
  }

  const bannerEl = document.getElementById('profileBanner');
  if (bannerEl) bannerEl.className = `profile-banner ${tipo || 'unknown'}`;

  const nombreEl = document.getElementById('nombrePerfil');
  if (nombreEl) nombreEl.textContent = nombre || 'Usuario';

  const rolEl = document.getElementById('rolBadge');
  if (rolEl) {
    if (tipo === 'asesor') {
      rolEl.className = 'profile-role-badge asesor';
      rolEl.innerHTML = '<i class="fas fa-user-tie me-1"></i> Asesor';
    } else if (tipo === 'asesorado') {
      rolEl.className = 'profile-role-badge asesorado';
      rolEl.innerHTML = '<i class="fas fa-user-graduate me-1"></i> Asesorado';
    } else {
      rolEl.className = 'profile-role-badge unknown';
      rolEl.innerHTML = '<i class="fas fa-user me-1"></i> Usuario';
    }
  }

  // Calificación (solo tiene sentido para asesores)
  const secCal = document.getElementById('seccionCalificacion');
  if (secCal) secCal.style.display = tipo === 'asesor' ? '' : 'none';

  if (tipo === 'asesor') {
    const llenas = calificacion ? Math.round(calificacion) : 0;
    const vacias = 5 - llenas;
    const estEl  = document.getElementById('calificacionEstrellas');
    const numEl  = document.getElementById('calificacionNum');
    if (estEl) estEl.textContent = '⭐'.repeat(llenas) + '☆'.repeat(vacias);
    if (numEl) numEl.textContent = calificacion
      ? `${Number(calificacion).toFixed(1)} / 5.0`
      : 'Sin calificaciones aún';
  }

  mostrarSeccionesSegunContexto(tipo);
}

// ── SECCIONES SEGÚN CONTEXTO ─────────────────────────────────
function mostrarSeccionesSegunContexto(tipoPerfilVisto) {
  const secEval   = document.getElementById('seccionEvaluacion');
  const secPropio = document.getElementById('seccionPropioMensaje');
  const btnAccion = document.getElementById('botonesAccion');
  const tituloSec = document.getElementById('tituloSeccion');
  const statLabel = document.getElementById('statLabel');

  if (secEval)   secEval.style.display   = 'none';
  if (secPropio) secPropio.style.display = 'none';

  if (esMiPerfil) {
    // ── MI PROPIO PERFIL ───────────────────────────
    if (tipoPerfilVisto === 'asesor') {
      if (tituloSec) tituloSec.innerHTML = '<i class="fas fa-calendar-check me-2"></i>Mis asesorías';
      if (statLabel) statLabel.textContent = 'Asesorías';

      if (btnAccion) {
        btnAccion.innerHTML = `
          <a href="registro_asesoria.html" class="btn action-btn btn-primary w-100">
            <i class="fas fa-plus me-1"></i> Nueva asesoría
          </a>
          <a href="dashboard.html" class="btn action-btn btn-outline-secondary w-100">
            <i class="fas fa-tachometer-alt me-1"></i> Mi panel
          </a>
        `;
      }

      if (secPropio) {
        secPropio.style.display = '';
        const msg = document.getElementById('mensajePropioTexto');
        if (msg) msg.innerHTML = 'Otros usuarios te evaluarán después de cada asesoría.<br>Crea o gestiona tus asesorías desde el menú.';
      }

    } else {
      // Soy asesorado viendo mi perfil
      if (tituloSec) tituloSec.innerHTML = '<i class="fas fa-book-open me-2"></i>Mis inscripciones';
      if (statLabel) statLabel.textContent = 'Inscripciones';

      if (btnAccion) {
        btnAccion.innerHTML = `
          <a href="buscador.html" class="btn action-btn btn-success w-100">
            <i class="fas fa-search me-1"></i> Buscar asesorías
          </a>
          <a href="dashboard.html" class="btn action-btn btn-outline-secondary w-100">
            <i class="fas fa-tachometer-alt me-1"></i> Mi panel
          </a>
        `;
      }

      if (secPropio) {
        secPropio.style.display = '';
        const msg = document.getElementById('mensajePropioTexto');
        if (msg) msg.innerHTML = 'Busca y únete a asesorías disponibles.<br>Aquí verás las sesiones en las que estás inscrito.';
      }
    }

  } else {
    // ── PERFIL AJENO ───────────────────────────────
    if (tipoPerfilVisto === 'asesor') {
      if (tituloSec) tituloSec.innerHTML = '<i class="fas fa-calendar-check me-2"></i>Asesorías disponibles';
      if (statLabel) statLabel.textContent = 'Asesorías';

      if (btnAccion) {
        btnAccion.innerHTML = `
          <a href="buscador.html" class="btn action-btn btn-success w-100">
            <i class="fas fa-search me-1"></i> Ver todas sus asesorías
          </a>
        `;
      }

      if (secEval) {
        secEval.style.display = '';
        configurarEstrellas();
      }

    } else {
      if (tituloSec) tituloSec.innerHTML = '<i class="fas fa-user-friends me-2"></i>Información del usuario';
      if (statLabel) statLabel.textContent = 'Inscripciones';
      if (btnAccion) btnAccion.innerHTML = '';
    }
  }
}

// ── CARGAR CONTENIDO DESDE EL BACKEND ────────────────────────
async function cargarContenidoPerfil() {
  try {
    const respuesta = await apiManager.get(`/asesorias/asesor/${asesorIdActual}`);

    if (respuesta.success) {
      const asesorias = respuesta.data;

      const tipoDetectado = asesorias.length > 0
        ? (asesorias[0].asesorId?.tipo_usuario || 'asesor')
        : tipoPerfilVisto || 'asesor';

      // Si es perfil ajeno y aún no lo renderizamos, hacerlo ahora con datos del backend
      if (!esMiPerfil) {
        const primeraAsesoria = asesorias[0];
        if (primeraAsesoria?.asesorId && typeof primeraAsesoria.asesorId === 'object') {
          const asesor = primeraAsesoria.asesorId;
          renderizarPerfil(asesor.nombre_usuario, asesor.tipo_usuario, asesor.calificacion);
        } else {
          renderizarPerfil('Asesor', 'asesor', null);
        }
      }

      mostrarListaAsesorias(asesorias, tipoDetectado);

      const disponibles = asesorias.filter(a => a.estado === 'disponible');
      const statEl = document.getElementById('statPrincipal');
      if (statEl) statEl.textContent = disponibles.length;
    }

  } catch (error) {
    // CORRECCIÓN: manejar sesión expirada
    if (error.message.includes('401')) {
      sessionManager.clearSession();
      alert('Tu sesión ha expirado. Por favor inicia sesión de nuevo.');
      window.location.href = 'index.html';
      return;
    }

    // Si falla (ej. 404) puede que sea un asesorado → cargar inscripciones
    console.warn('No se encontraron asesorías para este usuario:', error.message);

    if (esMiPerfil) {
      cargarMisInscripciones();
    } else {
      const listaEl = document.getElementById('listaPrincipal');
      if (listaEl) listaEl.innerHTML = '<p class="text-secondary text-center py-3">No hay asesorías registradas.</p>';
    }
  }
}

// Mostrar la lista de asesorías en el DOM
function mostrarListaAsesorias(asesorias, tipo) {
  const listaEl = document.getElementById('listaPrincipal');
  if (!listaEl) return;

  const disponibles = asesorias.filter(a => a.estado === 'disponible');

  if (disponibles.length === 0) {
    listaEl.innerHTML = '<p class="text-secondary text-center py-3">No hay asesorías disponibles actualmente.</p>';
    return;
  }

  listaEl.innerHTML = '';

  disponibles.forEach(a => {
    const fecha = new Date(a.horario);
    const fechaTexto = fecha.toLocaleString('es-MX', {
      weekday: 'long', day: '2-digit', month: 'long',
      hour: '2-digit', minute: '2-digit'
    });

    const materia = a.asignaturaId && typeof a.asignaturaId === 'object'
      ? a.asignaturaId.nombre
      : 'Materia';

    const div = document.createElement('div');
    div.className = 'asesoria-item';
    div.innerHTML = `
      <div class="asesoria-icon ${tipo || 'asesor'}">
        <i class="fas fa-chalkboard-teacher text-white"></i>
      </div>
      <div class="asesoria-text">
        <strong>${materia}</strong><br>
        <span><i class="fas fa-clock me-1" style="color:#38bdf8;"></i>${fechaTexto}</span>
        ${a.cupo ? `<span class="ms-2 badge bg-primary">${a.cupo} cupos</span>` : ''}
      </div>
    `;
    listaEl.appendChild(div);
  });
}

// Cargar las inscripciones del usuario asesorado logueado
async function cargarMisInscripciones() {
  const listaEl  = document.getElementById('listaPrincipal');
  const tituloEl = document.getElementById('tituloSeccion');

  if (tituloEl) tituloEl.innerHTML = '<i class="fas fa-book-open me-2"></i>Mis asesorías inscritas';

  try {
    const respuesta = await apiManager.getMyEnrollments();

    if (!respuesta.success || respuesta.data.length === 0) {
      if (listaEl) listaEl.innerHTML = '<p class="text-secondary text-center py-3">Aún no estás inscrito en ninguna asesoría. <a href="buscador.html" class="text-info">¡Busca una!</a></p>';
      return;
    }

    const inscripciones = respuesta.data;

    const statEl = document.getElementById('statPrincipal');
    if (statEl) statEl.textContent = inscripciones.length;

    listaEl.innerHTML = '';

    inscripciones.forEach(ins => {
      const a = ins.asesoriaId;
      if (!a) return;

      const fecha = new Date(a.horario);
      const fechaTexto = fecha.toLocaleString('es-MX', {
        weekday: 'long', day: '2-digit', month: 'long',
        hour: '2-digit', minute: '2-digit'
      });

      const materia = a.asignaturaId && typeof a.asignaturaId === 'object'
        ? a.asignaturaId.nombre
        : 'Materia';

      const div = document.createElement('div');
      div.className = 'asesoria-item';
      div.innerHTML = `
        <div class="asesoria-icon asesorado">
          <i class="fas fa-book-reader text-white"></i>
        </div>
        <div class="asesoria-text">
          <strong>${materia}</strong><br>
          <span><i class="fas fa-clock me-1" style="color:#34d399;"></i>${fechaTexto}</span>
          <span class="ms-2 badge ${ins.estado === 'activa' ? 'bg-success' : 'bg-secondary'}">${ins.estado}</span>
        </div>
      `;
      listaEl.appendChild(div);
    });

  } catch (error) {
    if (listaEl) listaEl.innerHTML = '<p class="text-danger text-center py-3">Error al cargar inscripciones.</p>';
    console.error(error);
  }
}

// Mostrar estado vacío cuando no hay ID disponible
function mostrarEstadoVacio() {
  const nombreEl = document.getElementById('nombrePerfil');
  if (nombreEl) nombreEl.textContent = 'Perfil no encontrado';
  const listaEl = document.getElementById('listaPrincipal');
  if (listaEl) listaEl.innerHTML = '<p class="text-secondary text-center">No se pudo cargar el perfil.</p>';
}

// ── ESTRELLAS ─────────────────────────────────────────────────
function configurarEstrellas() {
  const stars = document.querySelectorAll('.star');

  stars.forEach(star => {
    star.addEventListener('click', function () {
      calificacionSeleccionada = parseInt(this.getAttribute('data-value'));
      stars.forEach((s, i) => {
        s.classList.toggle('active', i < calificacionSeleccionada);
        s.style.color = i < calificacionSeleccionada ? 'gold' : '';
      });
    });

    star.addEventListener('mouseover', function () {
      const val = parseInt(this.getAttribute('data-value'));
      stars.forEach((s, i) => { s.style.color = i < val ? 'gold' : ''; });
    });

    star.addEventListener('mouseout', function () {
      stars.forEach((s, i) => {
        s.style.color = i < calificacionSeleccionada ? 'gold' : '';
      });
    });
  });
}

// ── ENVIAR EVALUACIÓN ─────────────────────────────────────────
async function enviarEvaluacion() {
  if (esMiPerfil) {
    alert('No puedes evaluarte a ti mismo');
    return;
  }
  if (tipoPerfilVisto !== 'asesor') {
    alert('Solo se puede evaluar a asesores');
    return;
  }
  if (calificacionSeleccionada === 0) {
    alert('Selecciona una calificación con las estrellas');
    return;
  }

  const comentario = document.getElementById('comentario').value.trim();

  const datos = {
    id_asesor:    asesorIdActual,
    calificacion: calificacionSeleccionada,
    comentario:   comentario || undefined
  };
  if (asesoriaIdEval) datos.id_asesoria = asesoriaIdEval;

  const btn = document.querySelector('button[onclick="enviarEvaluacion()"]');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...'; }

  try {
    const respuesta = await apiManager.evaluateAdvisor(datos);

    if (respuesta.success) {
      alert('¡Gracias! Tu evaluación fue enviada.');
      calificacionSeleccionada = 0;
      document.querySelectorAll('.star').forEach(s => { s.classList.remove('active'); s.style.color = ''; });
      document.getElementById('comentario').value = '';
    }

  } catch (error) {
    if      (error.message.includes('409')) alert('Ya evaluaste a este asesor en esta asesoría');
    else if (error.message.includes('403')) alert('Solo puedes evaluar asesorías en las que estuviste inscrito');
    else if (error.message.includes('404')) alert('La asesoría o el asesor no fue encontrado');
    else if (error.message.includes('401')) {
      sessionManager.clearSession();
      alert('Tu sesión ha expirado. Por favor inicia sesión de nuevo.');
      window.location.href = 'index.html';
    }
    else alert('Error: ' + error.message);
    console.error(error);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Enviar evaluación'; }
  }
}