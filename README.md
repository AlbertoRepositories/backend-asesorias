# 🎓 Sistema de Asesorías Académicas

![Badge Estado](https://img.shields.io/badge/Estado-Completo%20%26%20Funcional-brightgreen)
![Badge Node](https://img.shields.io/badge/Node.js-v18%2B-blue)
![Badge MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Local-47A248?logo=mongodb)
![Badge Express](https://img.shields.io/badge/Express.js-Backend-000000?logo=express)
![Badge Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap)

Plataforma integral web de arquitectura **Full-Stack** diseñada para la gestión, búsqueda, inscripción y evaluación de asesorías voluntarias o tutorías académicas. Conecta a estudiantes con asesores capacitados mediante un flujo intuitivo, notificaciones en tiempo real y perfiles de reputación.

---

## ✨ Características Principales

### 👥 Gestión de Roles
* **Asesores**: Tienen acceso a un panel de control (Dashboard) para registrar, editar, reprogramar y dar de baja asesorías, especificando materia, cupo, horario, modalidad (Presencial o Virtual) y ubicación/enlace.
* **Asesorados**: Pueden explorar el catálogo de asesorías, realizar inscripciones con un solo clic, gestionar sus asistencias y seguir a sus asesores favoritos.

### 🔍 Buscador Inteligente y Filtros
* Búsqueda en tiempo real por palabra clave (materia, nombre del asesor o descripción).
* Filtros avanzados por **asignatura específica**, **fecha programada** y **calificación mínima** del asesor.

### 🔔 Centro de Notificaciones Automáticas
* Alertas instantáneas ante la creación de nuevas asesorías por parte de asesores seguidos.
* Avisos automáticos de reprogramación o cancelación de sesiones para todos los alumnos inscritos.
* Alertas de cupo lleno y recordatorios.

### ⭐ Evaluaciones y Reputación
* Sistema de retroalimentación donde los alumnos evalúan a los asesores mediante una interfaz de estrellas (1 a 5) y comentarios opcionales.
* Cálculo automático del promedio de calificación visible en el perfil público de cada asesor.

### 💻 Interfaz Moderna (UI/UX)
* Estilizado con principios de **Glassmorphism**, fondos con gradientes inmersivos y diseño completamente responsivo adaptado para dispositivos móviles, tabletas y escritorio.

---

## 🛠️ Tecnologías y Estructura del Proyecto

El proyecto está dividido en dos capas principales que se comunican a través de una API RESTful segura:

```text
backend-asesorias/
├── backend/               # Servidor API REST (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── controllers/   # Lógica de manejo de peticiones HTTP
│   │   ├── middlewares/   # Autenticación JWT y manejo de errores
│   │   ├── models/        # Esquemas de Mongoose (User, Asesoria, Inscripcion, etc.)
│   │   ├── routes/        # Definición de endpoints de la API
│   │   ├── services/      # Lógica de negocio y consultas a la base de datos
│   │   └── app.js         # Configuración principal de Express
│   ├── .env.template      # Plantilla de variables de entorno
│   └── package.json       # Dependencias del backend
│
└── frontend/              # Aplicación Cliente (HTML5 + CSS3 + Vanilla JS ES6)
    ├── css/               # Estilos globales y compartidos (common.css)
    ├── js/
    │   ├── modules/       # Lógica modular por página (Buscador, Dashboard, Perfil, etc.)
    │   ├── api.js         # Cliente HTTP (Fetch API con envío de credenciales)
    │   ├── sessionManager # Gestión de estado de sesión local
    │   └── main.js        # Protección de rutas y eventos globales
    ├── index.html         # Página de bienvenida, inicio de sesión y registro
    ├── dashboard.html     # Menú principal y panel de administración
    ├── buscador.html      # Catálogo y filtrado de asesorías
    ├── perfil_asesor.html # Biografía, evaluaciones e historial del asesor
    ├── registro_asesoria.html # Formulario de creación/edición de asesorías
    └── notificaciones.html # Centro de mensajes y alertas
```

---

## 🚀 Guía de Instalación y Configuración

### 1. Requisitos Previos
* [Node.js](https://nodejs.org/) (v18 o superior).
* Servidor de [MongoDB](https://www.mongodb.com/) (Instancia local o clúster en MongoDB Atlas).
* Extensión **Live Server** (para VS Code) o cualquier servidor web estático para el frontend.

### 2. Configuración del Backend

1. Navega al directorio del backend:
   ```bash
   cd backend
   ```
2. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```
3. Copia el archivo de plantilla de variables de entorno y renómbralo a `.env`:
   ```bash
   cp .env.template .env
   ```
4. Configura tus variables en el archivo `.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/asesoriasDB
   JWT_SECRET=tu_clave_secreta_super_segura
   NODE_ENV=development
   ```
5. Inicia el servidor en modo desarrollo:
   ```bash
   npm run dev
   # O en modo producción: npm start
   ```
   *El servidor confirmará en la consola que está corriendo en el puerto 5000 y conectado a MongoDB.*

### 3. Ejecución del Frontend

1. Abre el directorio `frontend/` en tu editor de código (como VS Code).
2. Asegúrate de que el archivo `frontend/js/config.js` apunte a la URL correcta del backend (por defecto `http://localhost:5000/api`).
3. Inicia la aplicación abriendo el archivo `index.html` a través de **Live Server** (usualmente en `http://127.0.0.1:5500`).

---

## 🔐 Seguridad y Autenticación

El sistema implementa un flujo de seguridad robusto basado en **JSON Web Tokens (JWT)** e intercambio seguro de credenciales:
* **Cookies HTTP-Only**: El token de sesión se almacena en una cookie segura para prevenir ataques de tipo XSS (Cross-Site Scripting).
* **CORS Configurado**: El backend valida y permite solicitudes de orígenes específicos con el modo `credentials: true`.
* **Protección de Rutas Frontend**: El script `main.js` verifica continuamente la validez de la sesión y los permisos de rol (Asesor vs Asesorado) antes de renderizar páginas protegidas.
* **Encriptación de Contraseñas**: Todas las contraseñas se hashean utilizando `bcryptjs` antes de guardarse en la base de datos.

---

## 📜 Licencia

Este proyecto fue desarrollado con fines académicos y de gestión universitaria. Eres libre de utilizar, modificar y adaptar el código para tus propias implementaciones.
