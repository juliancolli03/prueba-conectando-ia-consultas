import mongoose from 'mongoose';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required. Please set it in your .env file.');
  }

  logger.info('Attempting to connect to MongoDB...');

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority',
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);
    
    // Manejo de eventos de conexión
    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    logger.error({ 
      error: {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      }, 
      uri: mongoUri.replace(/\/\/.*@/, '//***@') 
    }, 'MongoDB connection failed');
    throw error;
  }
};