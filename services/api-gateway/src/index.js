import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import leadsRouter from './routes/leads.js';
import webhooksRouter from './routes/webhooks.js';
import healthRouter from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware de seguridad
app.use(helmet());

// CORS configurable
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin.split(',').map(o => o.trim()),
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(pinoHttp({ logger }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Webhook rate limit más permisivo
const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many webhook requests from this IP, please try again later.',
});
app.use('/webhooks', webhookLimiter);

// Servir frontend estático si existe (producción)
// Intentar múltiples paths posibles
const possiblePaths = [
  join(__dirname, '../../../apps/web/dist'), // Desarrollo monorepo
  join(__dirname, '../../web/dist'), // Docker con copy
  join(process.cwd(), 'web/dist'), // Path absoluto desde raíz
  '/app/web/dist', // Docker path absoluto
];

let webDistPath = null;
for (const path of possiblePaths) {
  if (existsSync(path)) {
    webDistPath = path;
    break;
  }
}

if (webDistPath) {
  logger.info(`Serving static files from ${webDistPath}`);
  app.use(express.static(webDistPath));
  
  // SPA fallback: todas las rutas no-API sirven index.html
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/webhooks') && !req.path.startsWith('/health')) {
      const indexFile = join(webDistPath, 'index.html');
      if (existsSync(indexFile)) {
        res.sendFile(indexFile);
        return;
      }
    }
    next();
  });
} else {
  logger.info('No static files directory found. Frontend must be served separately.');
}

// Rutas
app.use('/health', healthRouter);
app.use('/api/leads', leadsRouter);
app.use('/webhooks/n8n', webhooksRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler global
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`CORS enabled for: ${corsOrigin}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});