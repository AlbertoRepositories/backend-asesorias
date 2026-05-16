// Importa Express para crear el servidor HTTP
import express from 'express';

// Importa dotenv para variables de entorno
import dotenv from 'dotenv';

// Importa cookie-parser para manejar cookies
import cookieParser from 'cookie-parser';

// Importa CORS middleware para permitir requests del frontend
import corsMiddleware from './middlewares/cors.middleware.js';

// Carga las variables de entorno desde el archivo .env
dotenv.config();

// Importa conexion a base de datos (modular)
import { connectDB } from './config/db.js';

// Importa la precarga de datos (Seed de catalogos)
import { seedAsignaturas } from './utils/seed.js';

// Importa el cron job para revisar asesorias sin inscritos
import { initCron } from './utils/cron.js';

// importación de rutas
import authRoutes from './routes/auth.routes.js';
import testRoutes from './routes/test.routes.js';
import evaluacionesRoutes from './routes/evaluaciones.routes.js';
import inscripcionesRoutes from './routes/inscripciones.routes.js';
import notificacionesRoutes from './routes/notificaciones.routes.js';
import asesoriasRoutes from './routes/asesorias.routes.js';
import asignaturasRoutes from './routes/asignaturas.routes.js';
import usersRoutes from './routes/users.routes.js';

// Importa middleware global de errores
import { errorHandler } from './middlewares/error.middleware.js';

// Crea la instancia de la aplicacion Express
const app = express();

// ========== MIDDLEWARES GLOBALES ==========

// Middleware CORS - DEBE SER LO PRIMERO ANTES QUE CUALQUIER OTRA COSA
// Esto permite que el frontend acceda a los endpoints del backend
app.use(corsMiddleware);

// Middleware para parsear cookies (SE AGREGA ANTES DE OTROS PARSERS)
app.use(cookieParser());

// Middleware para parsear JSON en el body de las peticiones
app.use(express.json());

// Middleware para parsear datos URL-encoded
app.use(express.urlencoded({ extended: true }));

// ========== RUTAS API ==========
app.use('/api/test',           testRoutes);
app.use('/api/auth',           authRoutes);
app.use('/api/evaluaciones',   evaluacionesRoutes);
app.use('/api/inscripciones',  inscripcionesRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/asesorias',      asesoriasRoutes);
app.use('/api/asignaturas',    asignaturasRoutes);
app.use('/api/users',          usersRoutes);

// ========== RUTA BASE ==========
// Ruta de bienvenida para verificar que el servidor esta activo
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servidor de Asesorías Voluntarias funcionando correctamente',
    version: '1.0.0'
  });
});

// ========== MIDDLEWARE DE MANEJO DE ERRORES ==========
// Este middleware debe estar SIEMPRE al final de todas las rutas
app.use(errorHandler);

// ========== CONEXION A BASE DE DATOS ==========

// Conecta a MongoDB usando la configuracion del archivo config/db.js
connectDB();

// ========== PRECARGA DE DATOS ==========

// Precarga las asignaturas (categorias de materias) en la base de datos
// si es que no existen ya
seedAsignaturas();

// ========== INICIALIZACION DE CRON JOB ==========

// Inicializa el proceso programado (cron) que se ejecuta periodicamente
// para verificar asesorias sin inscritos y notificar a los asesores
initCron();

// ========== INICIO DEL SERVIDOR ==========

// Obtiene el puerto desde variables de entorno o usa 5000 por defecto
const PORT = process.env.PORT || 5000;

// Inicia el servidor en el puerto especificado
app.listen(PORT, () => {
  console.log(`Servidor ejecutando en puerto ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS habilitado para origenes: ${process.env.ALLOWED_ORIGINS}`);
});

// Exporta la app
export default app;