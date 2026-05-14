/**
 * dashboard
 * gestiona la carga dinámica de asesorías agendadas y notificaciones
 */

async function initDashboard() {
    const user = sessionManager.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // diferenciación de vistas: se ocultan las secciones que no corresponden al rol del usuario
    if (user.tipo_usuario === 'asesor') {
        DomManager.hide('seccion-asesorado'); // Debes añadir este ID en tu HTML
        await cargarNotificacionesAsesor();
    } else {
        DomManager.hide('seccion-asesor'); // Debes añadir este ID en tu HTML
        await cargarMisInscripciones();
        await cargarNotificacionesAsesorado();
    }
}

/**
 * se cargan las asesorías donde el alumno está inscrito
 * usa GET /api/inscripciones/mis-asesorias
 */
async function cargarMisInscripciones() {
    const tablaCuerpo = document.querySelector('#tabla-inscripciones tbody');
    if (!tablaCuerpo) return;

    try {
        const respuesta = await apiManager.getMyEnrollments();
        
        if (respuesta.success && respuesta.data.length > 0) {
            tablaCuerpo.innerHTML = respuesta.data.map(inscripcion => {
                const a = inscripcion.asesoriaId;
                if (!a) return ''; // se ignoran inscripciones con asesoría nula

                const fecha = new Date(a.horario).toLocaleString('es-MX', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });

                // el populate del backend puede devolver el objeto asignaturaId directamente o solo el nombre si fue poblado correctamente
                const nombreMateria = a.asignaturaId?.nombre || 'Sin materia';
                const nombreAsesor  = a.asesorId?.nombre_usuario || 'Asesor';
                
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
        } else {
            tablaCuerpo.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No tienes asesorías agendadas.</td></tr>';
        }
    } catch (error) {
        console.error("Error al cargar inscripciones:", error);
        // si el error es 401, significa que la sesión expiró
        if (error.message.includes('401')) {
            tablaCuerpo.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Sesión expirada. Por favor <a href="index.html">inicia sesión</a>.</td></tr>';
        } else {
            tablaCuerpo.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al cargar las inscripciones.</td></tr>';
        }
    }
}

/**
 * se cargan las notificaciones para asesores
 * usa GET /api/notificaciones
 */
async function cargarNotificacionesAsesor() {
    try {
        const respuesta = await apiManager.getNotifications();
        // Las notificaciones se mostrarán en el HTML estático por ahora
        if (respuesta.success) {
            console.log('Notificaciones del asesor cargadas:', respuesta.data);
        }
    } catch (error) {
        console.error("Error al cargar notificaciones del asesor:", error);
    }
}

/**
 * se cargan las notificaciones para asesorados
 * usa GET /api/notificaciones
 */
async function cargarNotificacionesAsesorado() {
    try {
        const respuesta = await apiManager.getNotifications();
        // Las notificaciones se mostrarán en el HTML estático por ahora
        if (respuesta.success) {
            console.log('Notificaciones del asesorado cargadas:', respuesta.data);
        }
    } catch (error) {
        console.error("Error al cargar notificaciones del asesorado:", error);
    }
}

/**
 * lógica de desinscripción (Soft Delete Visual)
 * usa DELETE /api/inscripciones/:id [cite: 386, 398]
 */
window.confirmarDesinscripcion = async (inscripcionId) => {
    if (confirm("¿Seguro que quieres cancelar tu asistencia?")) {
        try {
            const respuesta = await apiManager.cancelEnrollment(inscripcionId);
            if (respuesta.success) {
                // borrado lógico visual que no requiere de recargar la página
                const fila = document.getElementById(`fila-${inscripcionId}`);
                fila.remove();
                alert("Te has desinscrito correctamente.");
            }
        } catch (error) {
            alert("No se pudo procesar la cancelación.");
        }
    }
};

// se ejecuta al cargar la página
document.addEventListener('DOMContentLoaded', initDashboard);