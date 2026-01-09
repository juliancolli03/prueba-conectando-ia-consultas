export const errorHandler = (err, req, res, next) => {
  req.log.error({ err }, 'Unhandled error');

  // Error de validación de Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      ok: false,
      error: 'Datos inválidos',
      details: err.errors
    });
  }

  // Error de MongoDB
  if (err.name === 'MongoServerError' || err.name === 'MongooseError') {
    return res.status(500).json({
      ok: false,
      error: 'Error de base de datos',
      message: process.env.NODE_ENV === 'production'
        ? 'Error al procesar la solicitud'
        : err.message
    });
  }

  // Error genérico
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message;

  res.status(statusCode).json({
    ok: false,
    error: 'Error interno',
    message
  });
};