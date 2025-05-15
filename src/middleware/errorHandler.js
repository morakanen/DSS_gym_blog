export const errorHandler = (err, req, res, next) => {
  // Log error for debugging (but not in production)
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  // Don't expose error details in production
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'An error occurred';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Default error
  res.status(err.status || 500).json({
    error: message
  });
};
