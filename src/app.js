// Importa Express para crear el servidor HTTP
import express from 'express';

// Importa dotenv para variables de entorno
import dotenv from 'dotenv';

// Importa conexión a base de datos (modular)
import { connectDB } from './config/db.js';

// Importa rutas
import authRoutes from './routes/auth.routes.js';
import testRoutes from './routes/test.routes.js';
import evaluacionesRoutes from './routes/evaluaciones.routes.js';

// Importa middleware global de errores
import { errorHandler } from './middlewares/error.middleware.js';

// Carga variables del .env
dotenv.config();

// Crea la app
const app = express();

// Middleware para leer JSON
app.use(express.json());


// =========================
// RUTAS
// =========================

app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/evaluaciones', evaluacionesRoutes);


// =========================
// RUTA BASE
// =========================

app.get('/', (req, res) => {
  res.send('API funcionando');
});


// =========================
// MIDDLEWARE DE ERRORES
// =========================

app.use(errorHandler); // SIEMPRE al final


// =========================
// CONEXIÓN A DB
// =========================

connectDB();


// =========================
// SERVER
// =========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});