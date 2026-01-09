import express from 'express';
import mongoose from 'mongoose';
import pino from 'pino';
import pinoHttp from 'pino-http';
import leadsRouter from './routes/leads.js';
import healthRouter from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { connectDB } from './config/database.js';
import Lead from './models/Lead.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});

const app = express();
const PORT = process.env.PORT || 4001;

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(pinoHttp({ logger }));

// Middleware de autenticación interna opcional
const internalAuth = (req, res, next) => {
  const internalToken = process.env.INTERNAL_TOKEN;
  if (internalToken) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }
    const token = authHeader.substring(7);
    if (token !== internalToken) {
      return res.status(401).json({
        ok: false,
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }
  }
  next();
};

// Rutas
app.use('/health', healthRouter);
app.use('/internal/leads', internalAuth, leadsRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler global
app.use(errorHandler);

// Conectar a MongoDB y levantar servidor
connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Leads Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  });