import { Request, Response, NextFunction } from 'express';

const SENSITIVE_KEYS = ['token', 'refreshtoken', 'accesstoken', 'password', 'secret', 'authorization', 'cookie', 'body', 'content'];

function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(k => lowerKey.includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(2, 9);
  (req as any).requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: duration,
      userId: (req as any).userId || 'anonymous',
      query: sanitizeObject(req.query),
    };
    
    // In production/dev, log clean JSON without leaking sensitive payload data
    console.log(`[REQ] ${logData.method} ${logData.path} ${logData.status} (${logData.durationMs}ms) - user:${logData.userId}`);
  });

  next();
}
