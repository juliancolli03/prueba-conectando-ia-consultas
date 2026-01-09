import express from 'express';
import { z } from 'zod';
import Lead from '../models/Lead.js';

const router = express.Router();

const upsertLeadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().optional(),
  category: z.enum(['consulta', 'reclamo', 'cotizacion', 'otros']).default('consulta'),
  categoryTag: z.string().max(50).nullable().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
  utm: z.record(z.string()).optional(),
  ip: z.string().optional(),
});

router.post('/upsert', async (req, res, next) => {
  try {
    // Validar input
    const validationResult = upsertLeadSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;
    const email = data.email.toLowerCase().trim();

    // Buscar lead existente
    let lead = await Lead.findOne({ email });

    if (lead) {
      // Actualizar lead existente
      lead.name = data.name.trim();
      lead.phone = data.phone?.trim() || lead.phone || '';
      lead.category = data.category || lead.category || 'consulta';
      lead.categoryTag = (data.category === 'otros' && data.categoryTag) ? data.categoryTag : (data.category !== 'otros' ? null : lead.categoryTag);
      lead.message = data.message?.trim() || lead.message || '';
      lead.source = data.source || lead.source || 'web';
      if (data.utm) {
        Object.entries(data.utm).forEach(([key, value]) => {
          lead.utm.set(key, value);
        });
      }
      lead.ip = data.ip || lead.ip || '';
      
      await lead.save();
      
      req.log.info({ leadId: lead._id, email, category: lead.category, categoryTag: lead.categoryTag }, 'Lead updated');
      
      return res.json({
        ok: true,
        status: 'updated',
        lead: {
          id: lead._id.toString(),
          _id: lead._id.toString(),
          email: lead.email,
          name: lead.name,
          phone: lead.phone,
          category: lead.category,
          categoryTag: lead.categoryTag,
          message: lead.message,
          source: lead.source,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt
        }
      });
    } else {
      // Crear nuevo lead
      lead = new Lead({
        name: data.name.trim(),
        email: email,
        phone: data.phone?.trim() || '',
        category: data.category || 'consulta',
        categoryTag: (data.category === 'otros' && data.categoryTag) ? data.categoryTag : null,
        message: data.message?.trim() || '',
        source: data.source || 'web',
        utm: data.utm || {},
        ip: data.ip || ''
      });

      await lead.save();
      
      req.log.info({ leadId: lead._id, email, category: lead.category, categoryTag: lead.categoryTag }, 'Lead created');
      
      return res.status(201).json({
        ok: true,
        status: 'created',
        lead: {
          id: lead._id.toString(),
          _id: lead._id.toString(),
          email: lead.email,
          name: lead.name,
          phone: lead.phone,
          category: lead.category,
          categoryTag: lead.categoryTag,
          message: lead.message,
          source: lead.source,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt
        }
      });
    }
  } catch (error) {
    // Error de duplicado (aunque no debería pasar con el índice único)
    if (error.code === 11000 || error.name === 'MongoServerError') {
      req.log.warn({ error: error.message }, 'Duplicate email detected, retrying update');
      
      // Intentar obtener el lead existente y actualizarlo
      try {
        const email = req.body.email?.toLowerCase().trim();
        const lead = await Lead.findOne({ email });
        if (lead) {
          lead.name = req.body.name?.trim() || lead.name;
          lead.phone = req.body.phone?.trim() || lead.phone;
          lead.category = req.body.category || lead.category || 'consulta';
          lead.categoryTag = (req.body.category === 'otros' && req.body.categoryTag) ? req.body.categoryTag : (req.body.category !== 'otros' ? null : lead.categoryTag);
          lead.message = req.body.message?.trim() || lead.message;
          if (req.body.source) lead.source = req.body.source;
          if (req.body.ip) lead.ip = req.body.ip;
          await lead.save();
          
          return res.json({
            ok: true,
            status: 'updated',
            lead: {
              id: lead._id.toString(),
              _id: lead._id.toString(),
              email: lead.email,
              name: lead.name,
              phone: lead.phone,
              category: lead.category,
              categoryTag: lead.categoryTag,
              message: lead.message,
              source: lead.source,
              createdAt: lead.createdAt,
              updatedAt: lead.updatedAt
            }
          });
        }
      } catch (retryError) {
        req.log.error({ error: retryError }, 'Error in duplicate retry');
      }
    }
    
    next(error);
  }
});

export default router;