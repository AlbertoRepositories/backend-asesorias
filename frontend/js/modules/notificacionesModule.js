// Módulo de Notificaciones - lógica para notificaciones.html
// Obtiene las notificaciones del backend y las muestra en pantalla

// Iconos y colores para cada tipo de notificación
const TIPOS_NOTIFICACION = {
  nueva_asesoria:     { emoji: '🔵', color: 'var(--info)',    badge: 'bg-info text-dark',   texto: 'Nueva' },
  asesoria_cancelada: { emoji: '🔴', color: 'var(--danger)',  badge: 'bg-danger',            texto: 'Cancelada' },
  inscripcion:        { emoji: '🟢', color: 'var(--success)', badge: 'bg-success',           texto: 'Confirmado' },
  desinscripcion:     { emoji: '🟡', color: 'var(--warning)', badge: 'bg-warning text-dark', texto: 'Aviso' },
  sin_inscritos:      { emoji: '🟠', color: 'var(--warning)', badge: 'bg-warning text-dark', texto: 'Sin inscritos' },
  cupo_lleno:         { emoji: '🔵', color: 'var(--info)',    badge: 'bg-info text-dark',   texto: 'Cupo lleno' },
};

// Inicializar la página cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {

  // CORRECCIÓN: Si no hay sesión activa, redirigir al login en lugar de
  // intentar llamar al backend y mostrar "Error de conexión"
  if (!sessionManager.isSessionActive()) {
    console.warn('Sin sesión activa. Redirigiendo al login...');
    window.location.href = 'index.html';
    return;
  }

  // Cargar las notificaciones del servidor
  cargarNotificaciones();
});

// Pedir las notificaciones al backend y mostrarlas
async function cargarNotificaciones() {
  const contenedorNoLeidas = document.getElementById('listaNotificacionesNoLeidas');
  const contenedorLeidas   = document.getElementById('listaNotificacionesLeidas');
  const badgeContador      = document.getElementById('badgeContador');

  // Mostrar indicador de carga mientras esperamos al servidor
  if (contenedorNoLeidas) {
    contenedorNoLeidas.innerHTML = '<div class="text-center text-muted py-4"><i class="fas fa-spinner fa-spin"></i> Cargando notificaciones...</div>';
  }

  try {
    const respuesta = await apiManager.getNotifications();

    if (!respuesta.success) {
      mostrarError(contenedorNoLeidas, 'No se pudieron obtener las notificaciones');
      return;
    }

    const notificaciones = respuesta.data;

    // Separar las leídas de las no leídas
    const noLeidas = notificaciones.filter(n => !n.leido);
    const leidas   = notificaciones.filter(n =>  n.leido);

    // Actualizar el contador en el badge
    if (badgeContador) {
      badgeContador.textContent = `${noLeidas.length} nueva${noLeidas.length !== 1 ? 's' : ''}`;
    }

    // Mostrar las no leídas
    if (contenedorNoLeidas) {
      if (noLeidas.length === 0) {
        contenedorNoLeidas.innerHTML = '<p class="text-muted text-center">No tienes notificaciones nuevas.</p>';
      } else {
        contenedorNoLeidas.innerHTML = '';
        noLeidas.forEach(n => contenedorNoLeidas.appendChild(crearTarjetaNotificacion(n, false)));
      }
    }

    // Mostrar las ya leídas
    if (contenedorLeidas) {
      if (leidas.length === 0) {
        contenedorLeidas.innerHTML = '<p class="text-muted text-center">No tienes notificaciones anteriores.</p>';
      } else {
        contenedorLeidas.innerHTML = '';
        leidas.forEach(n => contenedorLeidas.appendChild(crearTarjetaNotificacion(n, true)));
      }
    }

  } catch (error) {
    // CORRECCIÓN: si el error es 401 (sesión expirada), redirigir al login
    if (error.message.includes('401')) {
      sessionManager.clearSession();
      alert('Tu sesión ha expirado. Por favor inicia sesión de nuevo.');
      window.location.href = 'index.html';
      return;
    }
    mostrarError(contenedorNoLeidas, 'Error de conexión con el servidor');
    console.error('Error al cargar notificaciones:', error);
  }
}

// Crear una tarjeta HTML para una notificación
function crearTarjetaNotificacion(notificacion, esLeida) {
  let tipo = detectarTipoNotificacion(notificacion.titulo);

  const config = TIPOS_NOTIFICACION[tipo] || {
    emoji: '🔔', color: 'var(--primary)', badge: 'bg-primary', texto: 'Aviso'
  };

  // El modelo usa 'descripcion'
  const descripcionTexto = notificacion.descripcion || 'Sin descripción';

  // El modelo usa 'fechaCreacion'
  const fechaTexto = formatearFecha(notificacion.fechaCreacion || notificacion.createdAt);

  const col = document.createElement('div');
  col.className = 'col-12 col-md-6';

  const clasesLeida = esLeida ? 'leida' : '';

  col.innerHTML = `
    <div class="card card-notificacion p-3 h-100 ${clasesLeida}"
         style="border-left-color: ${config.color};"
         id="notif-${notificacion._id}">
      <div class="d-flex gap-3">
        <div class="card-header-icon">${config.emoji}</div>
        <div class="flex-grow-1">
          <h4 class="mb-1">${notificacion.titulo}</h4>
          <p class="mb-2 text-muted small">${descripcionTexto}</p>
          <span class="badge ${config.badge} me-2">${config.texto}</span>
          <span class="badge bg-secondary small">${fechaTexto}</span>
        </div>
      </div>
      <div class="divider-soft my-3"></div>
      <button class="btn btn-primary w-100"
              onclick="marcarComoLeida('${notificacion._id}', this)"
              ${esLeida ? 'disabled' : ''}>
        ${esLeida ? 'Ya leída' : 'Marcar como leída'}
      </button>
    </div>
  `;

  return col;
}

// Detectar el tipo de notificación por palabras en el título
function detectarTipoNotificacion(titulo) {
  const t = titulo.toLowerCase();

  if (t.includes('nueva') && t.includes('asesoría')) return 'nueva_asesoria';
  if (t.includes('cancelad'))                          return 'asesoria_cancelada';
  if (t.includes('inscrit'))                           return 'inscripcion';
  if (t.includes('desinscrit'))                        return 'desinscripcion';
  if (t.includes('sin inscritos') || t.includes('sin alumnos')) return 'sin_inscritos';
  if (t.includes('cupo lleno') || t.includes('lleno')) return 'cupo_lleno';

  return 'default';
}

// Marcar una notificación como leída en el backend
async function marcarComoLeida(notificacionId, boton) {
  boton.disabled    = true;
  boton.textContent = 'Marcando...';

  try {
    const respuesta = await apiManager.markNotificationAsRead(notificacionId);

    if (respuesta.success) {
      const tarjeta = document.getElementById(`notif-${notificacionId}`);
      if (tarjeta) {
        tarjeta.classList.add('leida');
        boton.textContent = 'Ya leída';
      }
      // Recargar para actualizar el contador del badge
      await cargarNotificaciones();
    }
  } catch (error) {
    boton.disabled    = false;
    boton.textContent = 'Marcar como leída';
    alert('No se pudo marcar la notificación: ' + error.message);
    console.error(error);
  }
}

// Mostrar un mensaje de error en un contenedor
function mostrarError(contenedor, mensaje) {
  if (contenedor) {
    contenedor.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle me-2"></i>${mensaje}
      </div>
    `;
  }
}

// Convertir una fecha ISO a formato legible en español
function formatearFecha(fechaISO) {
  if (!fechaISO) return 'Fecha desconocida';
  const fecha = new Date(fechaISO);
  return fecha.toLocaleString('es-MX', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit'
  });
}