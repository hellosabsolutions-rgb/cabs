/**
 * Centralized comprehensive error handler middleware for FleetOS API
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal Server Error';

  // 1. Handle JSON Body Parse SyntaxError
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload in request body.';
  }

  // 2. Handle Mongoose Bad ObjectId (CastError)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with invalid id format: ${err.value}`;
  }

  // 3. Handle Mongoose Duplicate Key Error (E11000)
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const val = err.keyValue ? err.keyValue[field] : '';
    message = `Duplicate value '${val}' for '${field}'. This record already exists.`;
  }

  // 4. Handle Mongoose Validation Error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors || {}).map(val => val.message);
    message = messages.length > 0 ? messages.join(', ') : 'Validation failed for request data.';
  }

  // 5. Handle JWT Authentication Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token signature.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session token has expired. Please refresh or sign in again.';
  }

  // 6. Handle Multer File Upload Errors
  else if (err.name === 'MulterError') {
    statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded file exceeds the maximum allowed size limit (10MB).';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected upload field: '${err.field}'.`;
    } else {
      message = `File upload error: ${err.message}`;
    }
  }

  // 7. Handle MongoDB Network / Connection Errors
  else if (
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongooseServerSelectionError'
  ) {
    statusCode = 503;
    message = 'Database service temporarily unavailable. Please verify MongoDB connection.';
  }

  // Log concise error in console
  console.error(`[API Error] ${req.method} ${req.originalUrl} - ${statusCode}: ${message}`);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

/**
 * 404 Route Not Found middleware
 */
export const notFound = (req, res, next) => {
  // Ignore browser DevTools probing
  if (req.path === '/json/version' || req.path.startsWith('/json/')) {
    return res.status(404).end();
  }

  const error = new Error(`Route Not Found - ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};
