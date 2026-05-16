import mongoose from 'mongoose';

// Función para conectar a MongoDB
export const connectDB = async () => {
  try {

    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB conectado');

  } catch (error) {

    console.error('Error conectando a Mongo:', error);
    process.exit(1); // Detiene el servidor si falla

  }
};