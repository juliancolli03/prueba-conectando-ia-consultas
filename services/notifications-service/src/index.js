import express from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import notifyRouter from './routes/notify.js';
import healthRouter from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { initializeEmailService } from './config/email.js';
import { initializeSheetsService } from './config/sheets.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});

const app = express();
const PORT = process.env.PORT || 4002;

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

// Inicializar servicios
try {
  initializeEmailService();
  logger.info('Email service initialized');
} catch (error) {
  logger.warn({ error: error.message }, 'Email service initialization failed (will continue)');
}

// Inicializar servicio de Google Sheets
try {
  initializeSheetsService();
  logger.info('Google Sheets service initialized');
} catch (error) {
  logger.warn({ error: error.message }, 'Google Sheets service initialization failed (will continue)');
}

// Rutas
app.use('/health', healthRouter);
app.use('/internal/notify', internalAuth, notifyRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler global
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Notifications Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});