/**
 * buscador
 * gestiona la búsqueda, filtrado y paginación de asesorías disponibles.
 */

// estado global del buscador para manejar filtros y paginación
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
    if (!user) {
        safeRedirect('index.html');
        return;
    }

    try {
        const sessionCheck = await apiManager.checkSession();
        if (!sessionCheck.valid) {
            console.warn('Sesión expirada en backend, limpiando y redirigiendo');
            sessionManager.clearSession();
            safeRedirect('index.html');
            return;
        }
    } catch (error) {
        console.warn('Error verificando sesión en buscador:', error);
        sessionManager.clearSession();
        safeRedirect('index.html');
        return;
    }

    await cargarFiltroMaterias();

    const filtrosGuardados = sessionStorage.getItem('filtros_busqueda');
    if (filtrosGuardados) {
        const parsed = JSON.parse(filtrosGuardados);
        Object.assign(estadoBusqueda, parsed);
        aplicarValoresAInputs();
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
        console.error('Error al cargar materias:', error);
    }
}

async function manejarFiltros(evento) {
    if (evento) evento.preventDefault();

    estadoBusqueda.page = 1;
    estadoBusqueda.asignaturaId = document.getElementById('filtro-materia')?.value || '';
    estadoBusqueda.calificacionMin = document.getElementById('filtro-calificacion')?.value || '';
    estadoBusqueda.horario = document.getElementById('filtro-horario')?.value || '';
    estadoBusqueda.disponibilidad = document.getElementById('filtro-disponibilidad')?.value || '';
    estadoBusqueda.searchText = document.getElementById('search-term')?.value || '';

    sessionStorage.setItem('filtros_busqueda', JSON.stringify(estadoBusqueda));
    await buscarAsesorias();
}

async function buscarAsesorias() {
    const contenedor = document.getElementById('contenedor-resultados');
    if (!contenedor) return;

    contenedor.innerHTML = '<div class="text-center w-100"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Buscando asesorías...</p></div>';

    try {
        const params = {};
        if (estadoBusqueda.page) params.page = estadoBusqueda.page;
        if (estadoBusqueda.limit) params.limit = estadoBusqueda.limit;
        if (estadoBusqueda.asignaturaId) params.asignaturaId = estadoBusqueda.asignaturaId;
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
            contenedor.innerHTML = '<div class="alert alert-info w-100 text-center">No se encontraron asesorías con esos criterios.</div>';
            actualizarPaginacion(0);
        }
    } catch (error) {
        if (error.message === 'SESSION_EXPIRED') {
            alert('Tu sesión ha expirado. Por favor inicia sesión de nuevo.');
            sessionManager.clearSession();
            safeRedirect('index.html');
            return;
        }
        contenedor.innerHTML = '<div class="alert alert-danger w-100">Error al conectar con el servidor.</div>';
        console.error('Error en búsqueda de asesorías:', error);
    }
}

function aplicarValoresAInputs() {
    document.getElementById('filtro-materia')?.value = estadoBusqueda.asignaturaId;
    document.getElementById('filtro-calificacion')?.value = estadoBusqueda.calificacionMin;
    document.getElementById('filtro-horario')?.value = estadoBusqueda.horario;
    document.getElementById('filtro-disponibilidad')?.value = estadoBusqueda.disponibilidad;
    document.getElementById('search-term')?.value = estadoBusqueda.searchText;
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

            if (!candidato.includes(texto)) {
                return false;
            }
        }

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

function renderizarTarjetas(asesorias) {
    const contenedor = document.getElementById('contenedor-resultados');
    contenedor.innerHTML = '';

    asesorias.forEach(as => {
        const rating = as.asesorId?.calificacion
            ? `⭐ ${as.asesorId.calificacion.toFixed(1)}`
            : 'Sin calificar';

        const card = `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="card card-asesoria p-4 h-100">
                    <div class="d-flex justify-content-between">
                        <span class="badge bg-primary mb-2">${as.asignaturaId?.nombre || 'Materia desconocida'}</span>
                        <span class="text-warning fw-bold">${rating}</span>
                    </div>
                    <h4><strong>${(as.descripcion || '').substring(0, 60)}...</strong></h4>
                    <p class="mb-1"><strong>Asesor:</strong> ${as.asesorId?.nombre_usuario || 'Desconocido'}</p>
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

window.verDetallesAsesoria = async (id) => {
    try {
        const respuesta = await apiManager.get(`/asesorias/${id}`);
        if (respuesta.success) {
            const as = respuesta.data;
            const horario = new Date(as.horario);
            document.getElementById('modal-titulo').textContent = as.asignaturaId?.nombre || 'Asesoría';
            document.getElementById('modal-asesor').textContent = as.asesorId?.nombre_usuario || 'Desconocido';
            document.getElementById('modal-descripcion').textContent = as.descripcion || 'Sin descripción';
            document.getElementById('modal-cupo').textContent = `${as.cupo} lugares totales`;
            document.getElementById('modal-horario').textContent = horario.toLocaleString();
            document.getElementById('modal-fecha').textContent = horario.toLocaleDateString();
            document.getElementById('modal-hora').textContent = horario.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            document.getElementById('modal-ubicacion').textContent = as.ubicacion || 'Por definir';
            document.getElementById('modal-modalidad').textContent = as.modalidad || 'Por definir';
            document.getElementById('modal-cupo-detalle').textContent = `${as.cupo} cupos disponibles`;

            const btnInscribir = document.getElementById('btn-confirmar-inscripcion');
            if (btnInscribir) {
                btnInscribir.setAttribute('onclick', `ejecutarInscripcion('${as._id}')`);
                btnInscribir.disabled = sessionManager.getUserType() === 'asesor';
            }

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
        alert('No se pudieron cargar los detalles.');
    }
};

window.ejecutarInscripcion = async (asesoriaId) => {
    if (!sessionManager.isSessionActive()) {
        alert('Debes iniciar sesión para inscribirte a una asesoría.');
        window.location.href = 'index.html';
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
        if (error.message === 'SESSION_EXPIRED' || error.message.includes('401')) {
            alert('Tu sesión expiró. Por favor inicia sesión de nuevo.');
            sessionManager.clearSession();
            safeRedirect('index.html');
            return;
        }
        if (error.message.includes('400')) {
            alert('Cupo lleno o datos inválidos.');
        } else if (error.message.includes('409')) {
            alert('Ya estás inscrito en esta asesoría.');
        } else {
            alert('Error al procesar la inscripción: ' + error.message);
        }
    }
};

function safeRedirect(url) {
    if (window.redirecting) {
        console.warn('Redirección ya en progreso, ignorando');
        return;
    }
    window.redirecting = true;
    setTimeout(() => {
        window.location.href = url;
    }, 100);
}

document.addEventListener('DOMContentLoaded', initBuscador);
