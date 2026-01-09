export const errorHandler = (err, req, res, next) => {
  req.log.error({ err }, 'Unhandled error');

  // Error de validación de Zod
  if (err.name === 'ZodError') {
    // Best-effort: responder 200 aunque haya error
    return res.status(200).json({
      ok: false,
      error: 'Datos inválidos',
      details: err.errors
    });
  }

  // Error genérico - siempre responder 200 en notifications (best-effort)
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message;

  res.status(200).json({
    ok: false,
    error: 'Error interno',
    message
  });
};