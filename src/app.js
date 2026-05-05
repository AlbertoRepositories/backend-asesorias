// Importa Express para crear el servidor HTTP
import express from 'express';

// Importa Mongoose para conectarse a MongoDB
import mongoose from 'mongoose';

// Importa dotenv para leer variables de entorno (.env)
import dotenv from 'dotenv';

// Importa rutas de autenticación
import authRoutes from './routes/auth.routes.js';

// Carga variables del archivo .env
dotenv.config();

// Crea la app de Express
const app = express();

// Middleware para poder leer JSON en el body de las requests
app.use(express.json());

// Conexión a MongoDB usando la URI del .env
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Mongo conectado')) // Si conecta bien
  .catch(err => console.log(err)); // Si hay error

// Ruta de prueba (para saber si el server vive)
app.get('/', (req, res) => {
  res.send('API funcionando');
});



// Usa esas rutas bajo el prefijo /api/auth
app.use('/api/auth', authRoutes);

// Levanta el servidor en el puerto 3000
app.listen(3000, () => {
  console.log('Servidor en puerto 3000');
});