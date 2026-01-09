import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;