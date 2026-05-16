// evaluacionesModule.js — lógica para perfil.html
//
// Esta página es el "Perfil del Asesor":
//   - Muestra el nombre, calificación y asesorías de UN asesor
//   - Si quien visita es un ASESORADO → ve el formulario de evaluación
//   - Si quien visita es el PROPIO ASESOR → ve un mensaje en lugar del formulario

let calificacionSeleccionada = 0;  // estrella elegida por el usuario
let asesorIdActual  = null;         // id del asesor cuyo perfil se muestra
let asesoriaIdEval  = null;         // id de asesoría para vincular la evaluación
let esMiPerfil      = false;        // true si el usuario logueado es el asesor del perfil

document.addEventListener('DOMContentLoaded', async function () {
  const params   = new URLSearchParams(window.location.search);
  asesorIdActual = params.get('asesorId') || params.get('id');
  asesoriaIdEval = params.get('asesoriaId');

  const usuario = sessionManager.isSessionActive() ? sessionManager.getUser() : null;

  // Si no viene ?id= en la URL, usamos el del usuario logueado
  if (!asesorIdActual && usuario) {
    asesorIdActual = usuario._id;
  }

  // Comparar para saber si el asesor que se muestra ES el usuario logueado
  if (usuario && asesorIdActual === usuario._id) {
    esMiPerfil = true;
  }

  if (!asesorIdActual) {
    mostrarError('No se proporcionó un ID de asesor. Agrega ?id=<id> a la URL.');
    return;
  }

  // si es mi propio perfil, mostrar datos locales de sesión inmediatamente
  if (esMiPerfil && usuario) {
    mostrarDatosPerfil(usuario.nombre_usuario, usuario.calificacion);
    const btnBox = document.getElementById('botonesAsesorPropios');
    if (btnBox) btnBox.style.display = '';
  }

  // Decidir qué mostrar en la sección de evaluación
  configurarSeccionEvaluacion(usuario);
  configurarBotonSeguir(usuario);
  await cargarAsesorias(asesorIdActual);
});

// sección de evaluación:

// decide si mostrar el formulario de evaluación, un mensaje o nada,
// según quién visita el perfil
function configurarSeccionEvaluacion(usuario) {
  const seccion = document.getElementById('seccionEvaluacion');
  if (!seccion) return;

  const esAsesorado = usuario && usuario.tipo_usuario === 'asesorado';
  const esAsesor    = usuario && usuario.tipo_usuario === 'asesor';

  if (esMiPerfil && esAsesor) {
    // el asesor ve su propio perfil → mensaje informativo en lugar del formulario
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
    // asesorado viendo el perfil de otro asesor → activar estrellas interactivas
    configurarEstrellas();
  } else {
    // asesor viendo el perfil de otro, o usuario sin sesión → ocultar la sección
    seccion.style.display = 'none';
  }
}

// botón seguir:

// configura el botón "Seguir asesor" / "Dejar de seguir"
// solo visible para asesorados que visitan el perfil de otro asesor
async function configurarBotonSeguir(usuario) {
  const btn = document.getElementById('btnSeguirAsesor');
  if (!btn) return;

  // ocultar el botón si el usuario es asesor o si es su propio perfil
  if (!usuario || usuario.tipo_usuario === 'asesor' || esMiPerfil) {
    btn.style.display = 'none';
    return;
  }

  try {
    const respuesta = await apiManager.getAsesoresSeguidos();
    const yaSigue   = (respuesta.data || []).some(a => a._id === asesorIdActual);

    actualizarBotonSeguir(btn, yaSigue);

    btn.addEventListener('click', async () => {
      try {
        if (btn.dataset.siguiendo === 'true') {
          await apiManager.dejarDeSeguirAsesor(asesorIdActual);
          actualizarBotonSeguir(btn, false);
          alert('Has dejado de seguir a este asesor.');
        } else {
          await apiManager.seguirAsesor(asesorIdActual);
          actualizarBotonSeguir(btn, true);
          alert('¡Ahora sigues a este asesor! Recibirás notificaciones de sus nuevas asesorías.');
        }
      } catch (error) {
        if (error.message === '403') {
          alert('Solo los asesorados pueden seguir asesores.');
        } else if (error.message === '404') {
          alert('El asesor no fue encontrado.');
        } else {
          alert('No se pudo actualizar el seguimiento. Intenta de nuevo.');
        }
        console.error('Error al cambiar seguimiento:', error);
      }
    });

  } catch (error) {
    console.error('Error al obtener asesores seguidos:', error);
    btn.style.display = 'none';
  }
}

function actualizarBotonSeguir(btn, yaSigue) {
  btn.dataset.siguiendo = yaSigue.toString();
  btn.textContent       = yaSigue ? 'Dejar de seguir' : 'Seguir asesor';
  btn.className         = yaSigue ? 'btn btn-outline-secondary' : 'btn btn-primary';
}

// datos del perfil:

function mostrarDatosPerfil(nombre, calificacion) {
  const avatarEl = document.getElementById('avatarInicial');
  if (avatarEl && nombre) avatarEl.textContent = nombre.charAt(0).toUpperCase();

  const nombreEl = document.getElementById('nombreAsesor');
  if (nombreEl) nombreEl.textContent = nombre || 'Asesor';

  const estEl = document.getElementById('calificacionEstrellas');
  const numEl = document.getElementById('calificacionNum');

  if (estEl) {
    if (calificacion !== null && calificacion !== undefined) {
      const llenas = Math.round(Number(calificacion));
      estEl.textContent = '⭐'.repeat(llenas) + '☆'.repeat(5 - llenas);
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

// asesorías del asesor:

// GET /api/asesorias/asesor/:id
async function cargarAsesorias(asesorId) {
  const listaEl = document.getElementById('listaAsesorias');

  try {
    const respuesta   = await apiManager.get(`/asesorias/asesor/${asesorId}`);
    if (!respuesta.success) throw new Error('Sin datos');

    const todas       = respuesta.data;
    const disponibles = todas.filter(a => a.estado === 'disponible');

    // actualizar estadísticas
    const statTotal = document.getElementById('statAsesorias');
    const statDisp  = document.getElementById('statDisponibles');
    if (statTotal) statTotal.textContent = todas.length;
    if (statDisp)  statDisp.textContent  = disponibles.length;

    // si no somos el asesor logueado, obtener sus datos desde la respuesta
    if (!esMiPerfil && todas.length > 0) {
      const asesorData = todas[0].asesorId;
      if (asesorData && typeof asesorData === 'object') {
        mostrarDatosPerfil(asesorData.nombre_usuario, asesorData.calificacion);
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
      const fecha = new Date(a.horario);
      const fechaTexto = fecha.toLocaleString('es-MX', {
        weekday: 'long', day: '2-digit', month: 'long',
        hour: '2-digit', minute: '2-digit'
      });
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

// estrellas interactivas:
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

// enviar evaluación:

// POST /api/evaluaciones
// se envía asesorId y asesoriaId (nombres que espera el backend)
async function enviarEvaluacion() {
  if (esMiPerfil) {
    alert('No puedes evaluarte a ti mismo.');
    return;
  }

  // Verificar que se eligió una calificación
  if (calificacionSeleccionada === 0) {
    alert('Selecciona una calificación con las estrellas antes de enviar.');
    return;
  }

  if (!asesorIdActual) {
    alert('No se pudo identificar al asesor.');
    return;
  }

  // asesoriaId es opcional; si no viene en la URL se envía null
  if (!asesoriaIdEval) {
    alert('No se encontró la asesoría a evaluar. Accede al perfil desde los detalles de una asesoría en la que estuviste inscrito.');
    return;
  }

  const comentario = document.getElementById('comentario')?.value.trim() || '';

  const btn = document.querySelector('button[onclick="enviarEvaluacion()"]');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
  }

  try {
    // campos con el nombre correcto para el backend
    const respuesta = await apiManager.evaluateAdvisor({
      asesorId:    asesorIdActual,
      asesoriaId:  asesoriaIdEval,
      calificacion: calificacionSeleccionada,
      comentario
    });

    if (respuesta.success) {
      alert('¡Gracias! Tu evaluación fue enviada correctamente.');

      // limpiar el formulario
      calificacionSeleccionada = 0;
      document.querySelectorAll('.star').forEach(s => {
        s.classList.remove('active');
        s.style.color = '';
      });
      const comentarioEl = document.getElementById('comentario');
      if (comentarioEl) comentarioEl.value = '';

      await cargarAsesorias(asesorIdActual);
    }

  } catch (error) {
    if (error.message === '409') {
      alert('Ya evaluaste a este asesor.');
    } else if (error.message === '403') {
      alert('Solo puedes evaluar a asesores con los que te has inscrito.');
    } else if (error.message === '404') {
      alert('La asesoría o el asesor no fue encontrado.');
    } else {
      alert('Error al enviar la evaluación: ' + error.message);
    }
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