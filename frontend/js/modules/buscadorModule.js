/**
 * buscador
 * gestiona la búsqueda, filtrado y paginación de asesorías disponibles.
 */

// el estado global del buscador para manejar la paginación y filtros persistentes
let estadoBusqueda = {
    page: 1,
    limit: 10,
    asignaturaId: '',
    calificacionMin: '',
    horario: '',
    disponibilidad: ''
};

/**
 * se inicializa el buscador cuando se carga la página
 */
async function initBuscador() {
    // se carga el catálogo de materias para el filtro desplegable
    await cargarFiltroMaterias();

    // se obtienen los filtros del sessionStorage si existen
    const filtrosGuardados = sessionStorage.getItem('filtros_busqueda');
    if (filtrosGuardados) {
        estadoBusqueda = JSON.parse(filtrosGuardados);
        aplicarValoresAInputs(); // sincronización de la interfaz con los datos que estén guardados
    }

    // se registran los eventos ya que el DOM está listo
    const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
    if (btnAplicarFiltros) btnAplicarFiltros.addEventListener('click', manejarFiltros);

    const formBuscador = document.getElementById('form-buscador');
    if (formBuscador) formBuscador.addEventListener('submit', manejarFiltros);

    // búsqueda inicial
    await buscarAsesorias();
}

/**
 * se obtienen las asignaturas del backend para llenar el select de filtros
 * usa GET /api/asignaturas
 */
async function cargarFiltroMaterias() {
    const selectMateria = document.getElementById('filtro-materia');
    if (!selectMateria) return;

    try {
        const respuesta = await apiManager.get('/asignaturas');
        if (respuesta.success) {
            respuesta.data.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia._id;
                option.textContent = materia.nombre;
                selectMateria.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error al cargar materias:", error);
    }
}

/**
 * se obtienen los filtros de la interfaz y se realiza la petición al servidor
 */
async function manejarFiltros(evento) {
    if (evento) evento.preventDefault();

    estadoBusqueda.page = 1; // se reinicia a la primera página al filtrar
    estadoBusqueda.asignaturaId = document.getElementById('filtro-materia').value;
    estadoBusqueda.calificacionMin = document.getElementById('filtro-calificacion').value;
    estadoBusqueda.horario = document.getElementById('filtro-horario').value;
    estadoBusqueda.disponibilidad = document.getElementById('filtro-disponibilidad').value;

    // guardar en sessionStorage
    sessionStorage.setItem('filtros_busqueda', JSON.stringify(estadoBusqueda));
    
    await buscarAsesorias();
}

/**
 * petición principal al backend con filtros y paginación
 * usa GET /api/asesorias?page=...&limit=10&...
 */
async function buscarAsesorias() {
    const contenedor = document.getElementById('contenedor-resultados');
    if (!contenedor) return;

    // se muestra un indicador de carga
    contenedor.innerHTML = '<div class="text-center w-100"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Buscando asesorías...</p></div>';

    try {
        // se limpian filtros vacíos para la URL
        const params = {};
        if (estadoBusqueda.page) params.page = estadoBusqueda.page;
        if (estadoBusqueda.limit) params.limit = estadoBusqueda.limit;
        if (estadoBusqueda.asignaturaId) params.asignaturaId = estadoBusqueda.asignaturaId;
        if (estadoBusqueda.calificacionMin) params.calificacionMin = estadoBusqueda.calificacionMin;

        const respuesta = await apiManager.getAsesorias(params);

            if (respuesta.success && respuesta.data.length > 0) {
            const asesoriasFiltradas = aplicarFiltrosAdicionales(respuesta.data);
            if (asesoriasFiltradas.length > 0) {
                renderizarTarjetas(asesoriasFiltradas);
                actualizarPaginacion(asesoriasFiltradas.length);
            } else {
                contenedor.innerHTML = '<div class="alert alert-info w-100 text-center">No se encontraron asesorías con esos filtros.</div>';
                actualizarPaginacion(0);
            }
        } else {
            contenedor.innerHTML = '<div class="alert alert-info w-100 text-center">No se encontraron asesorías con esos criterios.</div>';
        }
    } catch (error) {
        contenedor.innerHTML = '<div class="alert alert-danger w-100">Error al conectar con el servidor.</div>';
    }
}

function aplicarValoresAInputs() {
    if (typeof DomManager !== 'undefined') {
        DomManager.setValue('filtro-materia', estadoBusqueda.asignaturaId);
        DomManager.setValue('filtro-calificacion', estadoBusqueda.calificacionMin);
        DomManager.setValue('filtro-horario', estadoBusqueda.horario);
        DomManager.setValue('filtro-disponibilidad', estadoBusqueda.disponibilidad);
    } else {
        const materia = document.getElementById('filtro-materia');
        const calificacion = document.getElementById('filtro-calificacion');
        const horario = document.getElementById('filtro-horario');
        const disponibilidad = document.getElementById('filtro-disponibilidad');
        if (materia) materia.value = estadoBusqueda.asignaturaId;
        if (calificacion) calificacion.value = estadoBusqueda.calificacionMin;
        if (horario) horario.value = estadoBusqueda.horario;
        if (disponibilidad) disponibilidad.value = estadoBusqueda.disponibilidad;
    }
}

function aplicarFiltrosAdicionales(asesorias) {
    return asesorias.filter(as => {
        if (estadoBusqueda.horario) {
            const hora = new Date(as.horario).getHours();
            if (estadoBusqueda.horario === 'Mañana' && hora >= 12) return false;
            if (estadoBusqueda.horario === 'Tarde' && hora < 12) return false;
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

/**
 * se genera el HTML dinámico para cada asesoría encontrada
 */
function renderizarTarjetas(asesorias) {
    const contenedor = document.getElementById('contenedor-resultados');
    contenedor.innerHTML = '';

    asesorias.forEach(as => {
        // se formatea la calificación (con estrellas)
        const rating = as.asesorId.calificacion 
            ? `⭐ ${as.asesorId.calificacion.toFixed(1)}` 
            : 'Sin calificar';

        const card = `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="card card-asesoria p-4 h-100">
                    <div class="d-flex justify-content-between">
                        <span class="badge bg-primary mb-2">${as.asignaturaId.nombre}</span>
                        <span class="text-warning fw-bold">${rating}</span>
                    </div>
                    <h4><strong>${as.descripcion.substring(0, 50)}...</strong></h4>
                    <p class="mb-1"><strong>Asesor:</strong> ${as.asesorId.nombre_usuario}</p>
                    <p class="mb-3"><strong>Fecha:</strong> ${new Date(as.horario).toLocaleDateString()}</p>
                    <button class="btn btn-primary mt-auto" onclick="verDetallesAsesoria('${as._id}')">
                        Ver detalles
                    </button>
                </div>
            </div>
        `;
        contenedor.innerHTML += card;
    });
}

/**
 * se abre el modal y carga los datos de una asesoría específica
 * usa GET /api/asesorias/:id
 */
window.verDetallesAsesoria = async (id) => {
    try {
        const respuesta = await apiManager.get(`/asesorias/${id}`);
        if (respuesta.success) {
            const as = respuesta.data;
            
            // se insertan los datos en el modal del HTML
            const horario = new Date(as.horario);
            document.getElementById('modal-titulo').textContent = as.asignaturaId.nombre;
            document.getElementById('modal-asesor').textContent = as.asesorId.nombre_usuario;
            document.getElementById('modal-descripcion').textContent = as.descripcion;
            document.getElementById('modal-cupo').textContent = `${as.cupo} lugares totales`;
            document.getElementById('modal-horario').textContent = horario.toLocaleString();
            document.getElementById('modal-fecha').textContent = horario.toLocaleDateString();
            document.getElementById('modal-hora').textContent = horario.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            document.getElementById('modal-ubicacion').textContent = as.ubicacion || 'Por definir';
            document.getElementById('modal-modalidad').textContent = as.modalidad || 'Por definir';
            document.getElementById('modal-cupo-detalle').textContent = `${as.cupo} cupos disponibles`;
            
            // se guardar el ID en el botón de inscripción
            const btnInscribir = document.getElementById('btn-confirmar-inscripcion');
            if (btnInscribir) {
                btnInscribir.setAttribute('onclick', `ejecutarInscripcion('${as._id}')`);
                // si el usuario es asesor, deshabilitar botón (Seguridad)
                btnInscribir.disabled = sessionManager.getUserType() === 'asesor';
            }

            // se muestra el modal
            const myModal = new bootstrap.Modal(document.getElementById('modalDetalles'));
            myModal.show();
        }
    } catch (error) {
        alert("No se pudieron cargar los detalles.");
    }
};

/**
 * se procesa la inscripción a la asesoría
 * usa POST /api/inscripciones  (con asesoriaId en el body)
 */
window.ejecutarInscripcion = async (asesoriaId) => {
    // se verifica que el usuario tenga sesión activa antes de intentar inscribirse
    if (!sessionManager.isSessionActive()) {
        alert("Debes iniciar sesión para inscribirte a una asesoría.");
        window.location.href = 'index.html';
        return;
    }

    // únicamente los asesorados pueden inscribirse
    if (sessionManager.getUserType() === 'asesor') {
        alert("Los asesores no pueden inscribirse a asesorías.");
        return;
    }

    try {
        // se usa el método de apiManager que envía el asesoriaId en el body
        const respuesta = await apiManager.enrollInAsesoria(asesoriaId);
        if (respuesta.success) {
            alert("¡Inscripción exitosa! Revisa tu Dashboard.");
            location.reload(); // Recargar para actualizar cupos
        }
    } catch (error) {
        // manejo de errores específicos del backend
        if (error.message.includes('401')) {
            alert("Tu sesión expiró. Por favor inicia sesión de nuevo.");
            window.location.href = 'index.html';
        } else if (error.message.includes('NO_VACANCIES') || error.message.includes('400')) {
            alert("Cupo lleno o ya estás inscrito en esta asesoría.");
        } else if (error.message.includes('409') || error.message.includes('ALREADY_ENROLLED')) {
            alert("Ya estás inscrito en esta asesoría.");
        } else if (error.message.includes('SCHEDULE_CONFLICT')) {
            alert("Tienes un conflicto de horario con otra asesoría en la que ya estás inscrito.");
        } else {
            alert("Error al procesar la inscripción: " + error.message);
        }
    }
};

// se ejecuta al cargar la página
document.addEventListener('DOMContentLoaded', initBuscador);