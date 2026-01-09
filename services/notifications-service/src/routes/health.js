import express from 'express';
import { verifyEmailConnection } from '../config/email.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const emailStatus = await verifyEmailConnection();
  
  res.json({
    ok: true,
    service: 'notifications-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    email: emailStatus ? 'configured' : 'not_configured'
  });
});

export default router;