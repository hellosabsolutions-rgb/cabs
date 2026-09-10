/**
 * Structured Application Logger
 * Outputs ISO timestamps, log levels, correlation IDs, and context.
 */

const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const correlationId = meta.correlationId || '-';
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] [Trace: ${correlationId}] ${message}${metaStr}`;
};

export const logger = {
  info: (message, meta = {}) => {
    console.log(formatMessage('info', message, meta));
  },
  warn: (message, meta = {}) => {
    console.warn(formatMessage('warn', message, meta));
  },
  error: (message, meta = {}) => {
    console.error(formatMessage('error', message, meta));
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('debug', message, meta));
    }
  }
};
