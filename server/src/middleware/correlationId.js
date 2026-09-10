import crypto from 'crypto';

/**
 * Correlation ID Middleware
 * Generates or propagates an X-Correlation-ID header on every inbound HTTP request.
 * Attaches the ID to req.correlationId for structured logging and audit traceability.
 */
export const correlationIdMiddleware = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
};
