// Importa Express para crear el servidor HTTP
import express from 'express';

// Importa dotenv para variables de entorno
import dotenv from 'dotenv';

// Carga las variables de entorno desde el archivo .env
dotenv.config();

// Importa conexión a base de datos (modular)
import { connectDB } from './config/db.js';

// Importa la precarga de datos (Seed de catálogos)
import { seedAsignaturas } from './utils/seed.js';

// Importa el cron job para revisar asesorías sin inscritos
import { initCron } from './utils/cron.js';

// Importa rutas
import authRoutes from './routes/auth.routes.js';
import testRoutes from './routes/test.routes.js';
import evaluacionesRoutes from './routes/evaluaciones.routes.js';
import inscripcionesRoutes from './routes/inscripciones.routes.js';
import notificacionesRoutes from './routes/notificaciones.routes.js';
import asesoriasRoutes from './routes/asesorias.routes.js';
import asignaturasRoutes from './routes/asignaturas.routes.js';

// Importa middleware global de errores
import { errorHandler } from './middlewares/error.middleware.js';

// Crea la app
const app = express();

// Middleware para leer JSON
app.use(express.json());

// RUTAS
app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/evaluaciones', evaluacionesRoutes);
app.use('/api/inscripciones', inscripcionesRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/asesorias', asesoriasRoutes);
app.use('/api/asignaturas', asignaturasRoutes);

// RUTA BASE
app.get('/', (req, res) => {
  res.send('API funcionando');
});

// MIDDLEWARE DE ERRORES
app.use(errorHandler); // SIEMPRE al final

// CONEXIÓN A DB
connectDB();

// PRECARGA DE DATOS (Catálogos)
seedAsignaturas();

// inicialización de cron (programado para ejecutarse cada hora)
initCron();

// SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});