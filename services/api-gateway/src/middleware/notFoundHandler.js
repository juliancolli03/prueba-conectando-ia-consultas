export const notFoundHandler = (req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Not Found',
    message: `La ruta ${req.method} ${req.path} no existe`
  });
};