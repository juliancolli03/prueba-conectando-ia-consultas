import express from 'express';
import { z } from 'zod';
import axios from 'axios';
import { classifyMessageWithAI } from '../utils/classifyMessage.js';

const router = express.Router();

const leadSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  category: z.enum(['consulta', 'reclamo', 'cotizacion', 'otros']).optional(),
  categoryTag: z.string().max(50).optional(),
  message: z.string().optional(),
  source: z.string().optional(),
  utm: z.record(z.string()).optional(),
});

// Middleware de autenticación opcional para webhooks
const optionalAuth = (req, res, next) => {
  const webhookToken = process.env.WEBHOOK_TOKEN;
  if (webhookToken) {
    const providedToken = req.headers['x-webhook-token'];
    if (providedToken !== webhookToken) {
      return res.status(401).json({
        ok: false,
        error: 'Unauthorized',
        message: 'Invalid webhook token'
      });
    }
  }
  next();
};

router.post('/lead', optionalAuth, async (req, res, next) => {
  try {
    // Validar input
    const validationResult = leadSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;
    
    // Normalizar email
    const normalizedEmail = data.email.toLowerCase().trim();

    // Clasificar automáticamente con IA si no viene categoría
    let category = data.category;
    let categoryTag = data.categoryTag || null;
    
    if (!category && data.message) {
      req.log.info('Classifying message with AI (webhook)...');
      try {
        const classification = await classifyMessageWithAI(data.message);
        category = classification.category;
        categoryTag = classification.categoryTag;
        req.log.info({ 
          category, 
          categoryTag,
          messagePreview: data.message.substring(0, 50) 
        }, 'Message classified by AI');
      } catch (error) {
        req.log.warn({ error: error.message }, 'Failed to classify message with AI, using default');
        category = 'consulta';
        categoryTag = null;
      }
    }
    
    // Si aún no hay categoría, usar consulta por defecto
    category = category || 'consulta';
    // Si la categoría no es "otros", no debe haber tag
    if (category !== 'otros') {
      categoryTag = null;
    }

    // Preparar datos para leads-service
    const leadData = {
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone?.trim() || '',
      category: category,
      categoryTag: categoryTag,
      message: data.message?.trim() || '',
      source: data.source || 'n8n',
      utm: data.utm || {},
      ip: req.ip || req.socket.remoteAddress || 'unknown'
    };

    // Llamar a leads-service
    const leadsServiceUrl = process.env.LEADS_SERVICE_URL || 'http://leads-service:4001';
    let leadResponse;
    try {
      const response = await axios.post(
        `${leadsServiceUrl}/internal/leads/upsert`,
        leadData,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.INTERNAL_TOKEN && {
              'Authorization': `Bearer ${process.env.INTERNAL_TOKEN}`
            })
          },
          timeout: 5000
        }
      );
      leadResponse = response.data;
    } catch (error) {
      req.log.error({ error: error.message, url: leadsServiceUrl }, 'Error calling leads-service');
      return res.status(503).json({
        ok: false,
        error: 'Servicio de leads no disponible'
      });
    }

    if (!leadResponse.ok) {
      return res.status(500).json({
        ok: false,
        error: 'Error al procesar lead',
        message: leadResponse.error || 'Error desconocido'
      });
    }

    // Llamar a notifications-service (best-effort, no bloquear)
    const notificationsServiceUrl = process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:4002';
    let notified = false;
    try {
      // Asegurar que la categoría se pase correctamente al notifications-service
      const leadForNotification = {
        ...leadResponse.lead,
        category: leadResponse.lead.category || leadData.category || 'consulta',
        categoryTag: leadResponse.lead.categoryTag || leadData.categoryTag || null
      };
      
      req.log.info({ 
        leadCategory: leadForNotification.category, 
        leadCategoryTag: leadForNotification.categoryTag 
      }, 'Sending lead to notifications service (webhook)');
      
      const notifyResponse = await axios.post(
        `${notificationsServiceUrl}/internal/notify/lead`,
        {
          event: leadResponse.status === 'created' ? 'lead.created' : 'lead.updated',
          lead: leadForNotification,
          meta: {
            source: leadData.source,
            ip: leadData.ip
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.INTERNAL_TOKEN && {
              'Authorization': `Bearer ${process.env.INTERNAL_TOKEN}`
            })
          },
          timeout: 3000
        }
      );
      notified = notifyResponse.data.ok === true;
    } catch (error) {
      req.log.warn({ error: error.message }, 'Notification service unavailable (non-blocking)');
    }

    // Respuesta rápida
    res.status(200).json({
      ok: true,
      status: leadResponse.status,
      leadId: leadResponse.lead._id || leadResponse.lead.id,
      notified
    });

  } catch (error) {
    next(error);
  }
});

export default router;