export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, _req, res, _next) {
  if (error.name === 'CastError') return res.status(400).json({ message: 'The requested identifier is invalid.' });
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(error.errors).map((item) => item.message).join(', ') });
  }
  if (error.code === 11000) return res.status(409).json({ message: error.keyPattern?.email ? 'That email address is already in use.' : 'This record conflicts with an existing record.' });
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ message: status >= 500 ? 'The service is temporarily unavailable. Please try again.' : error.message || 'Invalid request.' });
}
