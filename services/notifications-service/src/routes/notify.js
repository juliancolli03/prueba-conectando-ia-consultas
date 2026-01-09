import express from 'express';
import { z } from 'zod';
import { sendEmail } from '../config/email.js';
import { saveLeadToSheet } from '../config/sheets.js';

const router = express.Router();

const notifyLeadSchema = z.object({
  event: z.enum(['lead.created', 'lead.updated']),
  lead: z.object({
    id: z.string().optional(),
    _id: z.string().optional(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    category: z.enum(['consulta', 'reclamo', 'cotizacion', 'otros']).optional(),
    categoryTag: z.string().nullable().optional(),
    message: z.string().optional(),
    source: z.string().optional(),
  }),
  meta: z.object({
    source: z.string().optional(),
    ip: z.string().optional(),
  }).optional(),
});

router.post('/lead', async (req, res) => {
  try {
    // Validar input
    const validationResult = notifyLeadSchema.safeParse(req.body);
    if (!validationResult.success) {
      req.log.warn({ errors: validationResult.error.errors }, 'Invalid notification payload');
      // Best-effort: responder 200 aunque haya error de validación
      return res.status(200).json({
        ok: false,
        error: 'Invalid payload',
        message: 'Notification payload validation failed'
      });
    }

    const { event, lead, meta } = validationResult.data;

    // Verificar configuración de email
    const fromEmail = process.env.FROM_EMAIL;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!fromEmail || !adminEmail) {
      req.log.warn('Email configuration missing (FROM_EMAIL or ADMIN_EMAIL)');
      return res.status(200).json({
        ok: false,
        error: 'Email not configured',
        message: 'FROM_EMAIL or ADMIN_EMAIL not set'
      });
    }

    // Mapear categorías a nombres legibles
    const categoryNames = {
      consulta: 'Consulta',
      reclamo: 'Reclamo',
      cotizacion: 'Cotización',
      otros: 'Otros'
    };
    
    const categoryName = categoryNames[lead.category] || lead.category || 'Consulta';
    
    // Si es "otros" y hay tag, agregarlo al nombre de categoría
    const displayCategory = (lead.category === 'otros' && lead.categoryTag) 
      ? `${categoryName} (${lead.categoryTag})`
      : categoryName;

    // Preparar contenido del email
    const isNew = event === 'lead.created';
    const subject = isNew
      ? `[${displayCategory}] Nuevo Lead: ${lead.name}`
      : `[${displayCategory}] Lead Actualizado: ${lead.name}`;

    const htmlBody = `
      <h2>${isNew ? 'Nuevo Lead Recibido' : 'Lead Actualizado'}</h2>
      <p><strong>Categoría:</strong> <span style="background-color: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${displayCategory}</span></p>
      ${lead.categoryTag ? `<p><strong>Tag sugerido por IA:</strong> <code style="background-color: #e8f4f8; padding: 2px 6px; border-radius: 3px;">${lead.categoryTag}</code></p>` : ''}
      <p><strong>Nombre:</strong> ${lead.name}</p>
      <p><strong>Email:</strong> ${lead.email}</p>
      ${lead.phone ? `<p><strong>Teléfono:</strong> ${lead.phone}</p>` : ''}
      ${lead.message ? `<p><strong>Mensaje:</strong><br>${lead.message.replace(/\n/g, '<br>')}</p>` : ''}
      ${lead.source ? `<p><strong>Fuente:</strong> ${lead.source}</p>` : ''}
      ${meta?.ip ? `<p><strong>IP:</strong> ${meta.ip}</p>` : ''}
      <hr>
      <p><small>Evento: ${event}</small></p>
      <p><small>Fecha: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</small></p>
    `;

    const textBody = `
${isNew ? 'NUEVO LEAD RECIBIDO' : 'LEAD ACTUALIZADO'}

Categoría: ${displayCategory}
${lead.categoryTag ? `Tag sugerido por IA: ${lead.categoryTag}` : ''}
Nombre: ${lead.name}
Email: ${lead.email}
${lead.phone ? `Teléfono: ${lead.phone}` : ''}
${lead.message ? `Mensaje: ${lead.message}` : ''}
${lead.source ? `Fuente: ${lead.source}` : ''}
${meta?.ip ? `IP: ${meta.ip}` : ''}

---
Evento: ${event}
Fecha: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
    `.trim();

    // Enviar email (best-effort: no debe bloquear ni romper)
    try {
      await sendEmail({
        from: `"Sistema de Leads" <${fromEmail}>`,
        to: adminEmail,
        subject: subject,
        text: textBody,
        html: htmlBody,
      });

      req.log.info({ leadEmail: lead.email, event }, 'Lead notification sent successfully');

      // Guardar en Google Sheets (best-effort, no bloquea)
      saveLeadToSheet({
        ...lead,
        createdAt: lead.createdAt || new Date().toISOString()
      }).catch(sheetsError => {
        req.log.warn({ error: sheetsError.message }, 'Failed to save to Google Sheets (non-blocking)');
      });

      return res.status(200).json({
        ok: true,
        message: 'Notification sent'
      });
    } catch (emailError) {
      // NO lanzar error 500, responder 200 con ok:false
      req.log.error(
        { error: emailError.message, leadEmail: lead.email },
        'Failed to send lead notification (non-blocking)'
      );

      return res.status(200).json({
        ok: false,
        error: 'Email send failed',
        message: emailError.message
      });
    }

  } catch (error) {
    // Catch-all para cualquier error inesperado
    req.log.error({ error: error.message }, 'Unexpected error in notification handler');
    
    // Best-effort: siempre responder 200
    return res.status(200).json({
      ok: false,
      error: 'Notification failed',
      message: process.env.NODE_ENV === 'production'
        ? 'Notification service error'
        : error.message
    });
  }
});

export default router;