// evaluacionesModule.js — lógica para perfil_asesor.html
//
// Esta página es el "Perfil del Asesor":
//   - Muestra el nombre, calificación y asesorías de UN asesor
//   - Si quien visita es un ASESORADO → ve el formulario de evaluación
//   - Si quien visita es el PROPIO ASESOR → ve un mensaje en lugar del formulario
//

let calificacionSeleccionada = 0;  // Estrella elegida por el usuario
let asesorIdActual   = null;        // ID del asesor cuyo perfil se muestra
let asesoriaIdEval   = null;        // ID de la asesoría a evaluar (opcional)
let esMiPerfil       = false;       // ¿El usuario logueado está viendo su propio perfil?

// ── INICIO ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {

  // Leer parámetros de la URL
  const params   = new URLSearchParams(window.location.search);
  asesorIdActual = params.get('id');
  asesoriaIdEval = params.get('asesoriaId');

  const usuario = sessionManager.isSessionActive() ? sessionManager.getUser() : null;

  // si no viene ?id= en la URL, se usa el del usuario logueado
  if (!asesorIdActual && usuario) {
    asesorIdActual = usuario._id;
  }

  if (usuario && asesorIdActual === usuario._id) {
    esMiPerfil = true;
  }

  if (!asesorIdActual) {
    mostrarError('No se proporcionó un ID de asesor. Agrega ?id=<id> a la URL.');
    return;
  }

  // Si estoy viendo mi propio perfil, cargo mis datos locales inmediatamente
  if (esMiPerfil && usuario) {
    mostrarDatosPerfil(usuario.nombre_usuario, usuario.calificacion);
    const btnBox = document.getElementById('botonesAsesorPropios');
    if (btnBox) btnBox.style.display = '';
  }

  configurarSeccionEvaluacion(usuario);

  // cargar asesorías y luego obtener los datos del perfil si hacen falta
  await cargarAsesorias(asesorIdActual);
});

// ── CONFIGURAR SECCIÓN DE EVALUACIÓN ─────────────────────────
// Según quién visita la página:
//   - Asesorado viendo perfil ajeno → formulario de evaluación
//   - Asesor viendo su propio perfil → mensaje informativo
//   - Asesor viendo perfil de otro asesor → ocultar (asesores no evalúan)
function configurarSeccionEvaluacion(usuario) {
  const seccion = document.getElementById('seccionEvaluacion');
  if (!seccion) return;

  const esAsesorado = usuario && usuario.tipo_usuario === 'asesorado';
  const esAsesor    = usuario && usuario.tipo_usuario === 'asesor';

  if (esMiPerfil && esAsesor) {
    seccion.innerHTML = `
      <div class="own-profile-msg">
        <i class="fas fa-info-circle fa-2x mb-3 d-block" style="color:#4338ca;"></i>
        <strong>Este es tu perfil de asesor</strong><br>
        <span style="color:#6366f1;">
          Los asesorados te evaluarán después de cada sesión.<br>
          Tu calificación promedio se actualiza automáticamente.
        </span>
      </div>
    `;
  } else if (esAsesorado && !esMiPerfil) {
    configurarEstrellas();
  } else {
    // Cualquier otro caso (asesor viendo perfil de otro asesor, sin sesión, etc.)
    seccion.style.display = 'none';
  }
}

// ── MOSTRAR DATOS DEL ASESOR EN EL DOM ───────────────────────
function mostrarDatosPerfil(nombre, calificacion) {
  const avatarEl = document.getElementById('avatarInicial');
  if (avatarEl && nombre) {
    avatarEl.textContent = nombre.charAt(0).toUpperCase();
  }

  const nombreEl = document.getElementById('nombreAsesor');
  if (nombreEl) nombreEl.textContent = nombre || 'Asesor';

  const estEl = document.getElementById('calificacionEstrellas');
  const numEl = document.getElementById('calificacionNum');

  if (estEl) {
    if (calificacion !== null && calificacion !== undefined) {
      const llenas = Math.round(Number(calificacion));
      const vacias = 5 - llenas;
      estEl.textContent = '⭐'.repeat(llenas) + '☆'.repeat(vacias);
    } else {
      estEl.textContent = '☆☆☆☆☆';
    }
  }
  if (numEl) {
    numEl.textContent = calificacion !== null && calificacion !== undefined
      ? `${Number(calificacion).toFixed(1)} / 5.0`
      : 'Sin calificaciones aún';
  }
}

// ── CARGAR ASESORÍAS DEL ASESOR ───────────────────────────────
// Ruta real del backend: GET /api/asesorias/asesor/:id
async function cargarAsesorias(asesorId) {
  const listaEl = document.getElementById('listaAsesorias');

  try {
    const respuesta = await apiManager.get(`/asesorias/asesor/${asesorId}`);

    if (!respuesta.success) throw new Error('Sin datos');

    const todas       = respuesta.data;
    const disponibles = todas.filter(a => a.estado === 'disponible');

    // Actualizar estadísticas
    const statTotal = document.getElementById('statAsesorias');
    const statDisp  = document.getElementById('statDisponibles');
    if (statTotal) statTotal.textContent = todas.length;
    if (statDisp)  statDisp.textContent  = disponibles.length;

    // obtener datos del asesor del primer resultado si no es mi perfil
    if (!esMiPerfil) {
      if (todas.length > 0 && todas[0].asesorId && typeof todas[0].asesorId === 'object') {
        const asesorData = todas[0].asesorId;
        mostrarDatosPerfil(asesorData.nombre_usuario, asesorData.calificacion);
      } else if (todas.length === 0) {
        // Sin asesorías: intentar obtener nombre desde evaluaciones
        await cargarNombreDesdeEvaluaciones(asesorId);
      }
    }

    // Mostrar la lista en el DOM
    if (!listaEl) return;

    if (disponibles.length === 0) {
      listaEl.innerHTML = '<p class="text-muted text-center py-3">No hay asesorías disponibles actualmente.</p>';
      return;
    }

    listaEl.innerHTML = '';

    disponibles.forEach(a => {
      // Formatear fecha y hora
      const fecha = new Date(a.horario);
      const fechaTexto = fecha.toLocaleString('es-MX', {
        weekday: 'long',
        day:     '2-digit',
        month:   'long',
        hour:    '2-digit',
        minute:  '2-digit'
      });

      // Nombre de la materia (puede venir populada o no)
      const nombreMateria = a.asignaturaId && typeof a.asignaturaId === 'object'
        ? a.asignaturaId.nombre
        : 'Materia';

      const div = document.createElement('div');
      div.className = 'asesoria-item';
      div.innerHTML = `
        <div class="asesoria-icon">
          <i class="fas fa-chalkboard-teacher text-white" style="font-size:0.9rem;"></i>
        </div>
        <div class="asesoria-text">
          <strong>${nombreMateria}</strong><br>
          <span>
            <i class="fas fa-clock me-1" style="color:#2563eb;"></i>${fechaTexto}
          </span>
          ${a.cupo ? `<span class="badge bg-primary ms-2">${a.cupo} cupos</span>` : ''}
        </div>
      `;
      listaEl.appendChild(div);
    });

  } catch (error) {
    if (listaEl) {
      listaEl.innerHTML = '<p class="text-danger text-center py-3"><i class="fas fa-exclamation-circle me-1"></i>Error al cargar asesorías.</p>';
    }
    console.error('Error al cargar asesorías del asesor:', error);
  }
}

// ── ESTRELLAS INTERACTIVAS ────────────────────────────────────
// fallback para mostrar nombre del asesor cuando no tiene asesorías
async function cargarNombreDesdeEvaluaciones(asesorId) {
  try {
    const respEval = await apiManager.getAdvisorEvaluations(asesorId);
    if (respEval.success && respEval.data.length > 0) {
      // Las evaluaciones tienen asesorId poblado
      const ev = respEval.data[0];
      if (ev.asesorId && typeof ev.asesorId === 'object') {
        mostrarDatosPerfil(ev.asesorId.nombre_usuario, ev.asesorId.calificacion);
        return;
      }
    }
    // Si tampoco hay evaluaciones, dejar los valores por defecto del HTML
    const nombreEl = document.getElementById('nombreAsesor');
    if (nombreEl && nombreEl.textContent === 'Cargando...') {
      nombreEl.textContent = 'Asesor';
    }
  } catch (_) {
    // Silencioso — no es crítico
  }
}

// estrellas interactivas
function configurarEstrellas() {
  const stars = document.querySelectorAll('.star');

  stars.forEach(star => {
    // Clic: fijar la calificación
    star.addEventListener('click', function () {
      calificacionSeleccionada = parseInt(this.getAttribute('data-value'));
      stars.forEach((s, i) => {
        s.classList.toggle('active', i < calificacionSeleccionada);
        s.style.color = i < calificacionSeleccionada ? 'gold' : '';
      });
    });

    // Hover: preview visual
    star.addEventListener('mouseover', function () {
      const val = parseInt(this.getAttribute('data-value'));
      stars.forEach((s, i) => { s.style.color = i < val ? 'gold' : ''; });
    });

    // Mouse fuera: volver a la selección actual
    star.addEventListener('mouseout', function () {
      stars.forEach((s, i) => {
        s.style.color = i < calificacionSeleccionada ? 'gold' : '';
      });
    });
  });
}

// ── ENVIAR EVALUACIÓN ─────────────────────────────────────────
// Ruta del backend: POST /api/evaluaciones
// enviar evaluación
async function enviarEvaluacion() {
  if (esMiPerfil) {
    alert('No puedes evaluarte a ti mismo');
    return;
  }

  if (calificacionSeleccionada === 0) {
    alert('Selecciona una calificación con las estrellas antes de enviar');
    return;
  }

  if (!asesorIdActual) {
    alert('No se pudo identificar al asesor');
    return;
  }

  // el campo asesoriaId es obligatorio en el backend y valida la inscripción
  // si no viene en la url, mostramos un aviso en vez de enviar un request fallido
  if (!asesoriaIdEval) {
    alert('Para evaluar a un asesor debes acceder desde una asesoría en la que estés inscrito. Ve al Dashboard y haz clic en el nombre del asesor desde tu tabla de asesorías agendadas.');
    return;
  }

  const comentario = document.getElementById('comentario').value.trim();

  const datos = {
    asesorId:    asesorIdActual,
    asesoriaId:  asesoriaIdEval,
    calificacion: calificacionSeleccionada,
    comentario:  comentario || undefined
  };

  const btn = document.querySelector('button[onclick="enviarEvaluacion()"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
  }

  try {
    const respuesta = await apiManager.evaluateAdvisor(datos);

    if (respuesta.success) {
      alert('¡Gracias! Tu evaluación fue enviada correctamente.');

      calificacionSeleccionada = 0;
      document.querySelectorAll('.star').forEach(s => {
        s.classList.remove('active');
        s.style.color = '';
      });
      document.getElementById('comentario').value = '';

      cargarAsesorias(asesorIdActual);
    }

  } catch (error) {
    if      (error.message.includes('409')) alert('Ya evaluaste a este asesor en esta asesoría');
    else if (error.message.includes('400')) alert('No estás inscrito a esta asesoría o los datos son inválidos');
    else if (error.message.includes('403')) alert('Solo los asesorados pueden enviar evaluaciones');
    else if (error.message.includes('404')) alert('La asesoría o el asesor no fue encontrado');
    else                                    alert('Error al enviar la evaluación: ' + error.message);
    console.error(error);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Enviar evaluación';
    }
  }
}

// ── ERROR GENERAL ─────────────────────────────────────────────
function mostrarError(mensaje) {
  const listaEl = document.getElementById('listaAsesorias');
  if (listaEl) listaEl.innerHTML = `<p class="text-danger text-center py-3">${mensaje}</p>`;
  const nombreEl = document.getElementById('nombreAsesor');
  if (nombreEl) nombreEl.textContent = 'No disponible';
}

// exponer para onclick en el HTML
window.enviarEvaluacion = enviarEvaluacion;