// Módulo de Asesorías - lógica para registro_asesoria.html
// Maneja crear, editar y cancelar asesorías con el backend

// Variable para saber qué asesoría estamos editando (null = nueva)
let asesoriaEditandoId = null;

// Función que se ejecuta cuando la página carga
async function iniciarPaginaAsesoria() {
  // Revisar si hay sesión activa
  // NOTA: si el login aún no guarda el token, continuamos de todas formas
  // para que se pueda probar la página durante el desarrollo
  if (!sessionManager.isSessionActive()) {
    console.warn('Sin sesión activa - modo desarrollo o login no conectado al backend');
    // En producción aquí iría:
    // alert('Debes iniciar sesión primero');
    // window.location.href = 'index.html';
    // return;
  }

  // Solo los asesores pueden crear asesorías
  // (solo verificamos el rol si hay sesión activa)
  if (sessionManager.isSessionActive() && sessionManager.getUserType() !== 'asesor') {
    alert('Solo los asesores pueden registrar asesorías');
    window.location.href = 'dashboard.html';
    return;
  }

  // Cargar la lista de asignaturas del backend
  await cargarAsignaturas();

  // Revisar si venimos a editar una asesoría (hay id en la URL)
  const params = new URLSearchParams(window.location.search);
  const asesoriaId = params.get('id');

  if (asesoriaId) {
    // Modo edición: cargar los datos de esa asesoría
    asesoriaEditandoId = asesoriaId;
    await cargarDatosAsesoria(asesoriaId);
  }
}

// Cargar las materias disponibles desde el backend
async function cargarAsignaturas() {
  const selectAsignatura = document.getElementById('selectAsignatura');

  try {
    // Pedir las asignaturas al servidor
    const respuesta = await apiManager.get('/asignaturas');

    if (respuesta.success && respuesta.data.length > 0) {
      // Limpiar opciones anteriores
      selectAsignatura.innerHTML = '<option value="">— Seleccione una asignatura —</option>';

      // Agregar cada asignatura que venga del backend
      respuesta.data.forEach(asignatura => {
        const opcion = document.createElement('option');
        opcion.value = asignatura._id;         // ID para mandar al backend
        opcion.textContent = asignatura.nombre; // Nombre que ve el usuario
        selectAsignatura.appendChild(opcion);
      });
    }
  } catch (error) {
    // Si falla, dejamos las opciones que ya estaban en el HTML
    console.error('No se pudieron cargar las asignaturas:', error);
  }
}

// Cargar los datos de una asesoría para editar
async function cargarDatosAsesoria(id) {
  try {
    const respuesta = await apiManager.get(`/asesorias/${id}`);

    if (respuesta.success) {
      const a = respuesta.data;

      // Poner el ID de la asignatura en el select
      document.getElementById('selectAsignatura').value = a.asignaturaId;

      // Poner la descripción
      document.getElementById('descripcion').value = a.descripcion;

      // Separar fecha y hora del horario (viene como ISO string)
      const fecha = new Date(a.horario);
      document.getElementById('fechaAsesoria').value = fecha.toISOString().split('T')[0];
      document.getElementById('horaInicio').value = fecha.toTimeString().substring(0, 5);

      // Calcular hora fin basada en duracion
      const horaFin = new Date(fecha.getTime() + a.duracionMin * 60000);
      document.getElementById('horaFin').value = horaFin.toTimeString().substring(0, 5);

      // Cupo
      document.getElementById('cupo').value = a.cupo;

      // Cambiar el título del botón para que diga "Actualizar"
      document.getElementById('btnRegistrar').textContent = 'Actualizar asesoría';
      document.getElementById('tituloFormulario').textContent = 'Editar asesoría';
    }
  } catch (error) {
    alert('Error al cargar los datos de la asesoría');
    console.error(error);
  }
}

// Función principal: enviar el formulario (crear o editar)
async function enviarFormularioAsesoria(evento) {
  // Evitar que el formulario recargue la página
  evento.preventDefault();

  // Leer los valores del formulario
  const asignaturaId = document.getElementById('selectAsignatura').value;
  const descripcion = document.getElementById('descripcion').value.trim();
  const fecha = document.getElementById('fechaAsesoria').value;
  const horaInicio = document.getElementById('horaInicio').value;
  const horaFin = document.getElementById('horaFin').value;
  const cupo = parseInt(document.getElementById('cupo').value);

  // Validaciones simples antes de mandar al servidor
  if (!asignaturaId) {
    alert('Por favor selecciona una asignatura');
    return;
  }

  if (descripcion.length < 30) {
    alert('La descripción debe tener al menos 30 caracteres');
    return;
  }

  if (!fecha || !horaInicio || !horaFin) {
    alert('Por favor completa la fecha y las horas');
    return;
  }

  if (cupo < 1) {
    alert('El cupo debe ser mayor a 0');
    return;
  }

  // Convertir fecha + hora inicio a formato ISO que entiende el backend
  const horarioISO = new Date(`${fecha}T${horaInicio}`).toISOString();

  // Calcular duración en minutos
  const inicio = new Date(`${fecha}T${horaInicio}`);
  const fin = new Date(`${fecha}T${horaFin}`);
  const duracionMin = Math.round((fin - inicio) / 60000);

  if (duracionMin <= 0) {
    alert('La hora de fin debe ser después de la hora de inicio');
    return;
  }

  // Armar el objeto que va al backend
  const datosAsesoria = {
    asignaturaId,
    descripcion,
    horario: horarioISO,
    duracionMin,
    cupo
  };

  try {
    let respuesta;

    if (asesoriaEditandoId) {
      // Modo edición: usar PUT
      respuesta = await apiManager.put(`/asesorias/${asesoriaEditandoId}`, datosAsesoria);
      if (respuesta.success) {
        alert('¡Asesoría actualizada con éxito!');
        window.location.href = 'dashboard.html';
      }
    } else {
      // Modo creación: usar POST
      respuesta = await apiManager.createAsesoria(datosAsesoria);
      if (respuesta.success) {
        alert('¡Asesoría registrada con éxito!');
        window.location.href = 'dashboard.html';
      }
    }
  } catch (error) {
    // Manejar errores del backend
    if (error.message.includes('409')) {
      alert('Tienes otra asesoría en ese mismo horario');
    } else if (error.message.includes('400')) {
      alert('Datos incorrectos, revisa el formulario');
    } else {
      alert('Error al guardar la asesoría: ' + error.message);
    }
    console.error(error);
  }
}

// Función para cancelar (dar de baja) una asesoría
async function darDeBajaAsesoria() {
  if (!asesoriaEditandoId) {
    alert('No hay ninguna asesoría seleccionada para cancelar');
    return;
  }

  try {
    const respuesta = await apiManager.deleteAsesoria(asesoriaEditandoId);

    if (respuesta.success) {
      alert('Asesoría cancelada. Los inscritos serán notificados.');
      // Cerrar el modal y volver al menú
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalDarDeBaja'));
      if (modal) modal.hide();
      window.location.href = 'dashboard.html';
    }
  } catch (error) {
    if (error.message.includes('404')) {
      alert('La asesoría no fue encontrada');
    } else {
      alert('Error al cancelar la asesoría: ' + error.message);
    }
    console.error(error);
  }
}

// Conectar los eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
  iniciarPaginaAsesoria();

  // Conectar el formulario al manejador
  const formulario = document.getElementById('formAsesoria');
  if (formulario) {
    formulario.addEventListener('submit', enviarFormularioAsesoria);
  }

  // Conectar el botón de "Sí, dar de baja"
  const btnBaja = document.getElementById('btnConfirmarBaja');
  if (btnBaja) {
    btnBaja.addEventListener('click', darDeBajaAsesoria);
  }
});
