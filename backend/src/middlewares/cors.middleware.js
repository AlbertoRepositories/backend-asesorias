// Importa CORS para permitir requests desde diferentes origenes
import cors from 'cors';

// Configuracion de CORS con lista blanca de dominios permitidos
// Esto previene ataques Cross-Origin Resource Sharing mientras permite
// que el frontend se comunique con el backend
const corsOptions = {
  // Lista blanca de origenes permitidos de forma manual y explícita
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5501',
    'http://127.0.0.1:5501',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost',
    'https://asesorias-frontend.onrender.com' // ← REEMPLAZAR por tu URL exacta de Render
  ],

  // Permite el envio de cookies y headers de autenticacion
  credentials: true,

  // Metodos HTTP permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Headers permitidos en las peticiones
  allowedHeaders: ['Content-Type', 'Authorization'],

  // Headers que el navegador puede acceder desde la respuesta
  exposedHeaders: ['Content-Length', 'X-JSON-Response-Type'],

  // Tiempo que el navegador cachea la informacion de pre-flight (en segundos)
  maxAge: 86400
};

// Middleware de CORS configurado
const corsMiddleware = cors(corsOptions);

// Exporta el middleware para ser usado en app.js
export default corsMiddleware;