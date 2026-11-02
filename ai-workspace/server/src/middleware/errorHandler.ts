/**
 * Central Error Handler Middleware
 * Standardized format aligned with 07 - API Specification.md:
 * { "error": { "code": "...", "message": "...", "requestId": "..." } }
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) || `req-${uuidv4().slice(0, 8)}`;
  const statusCode = err.status || err.statusCode || 500;
  const errorCode = err.code || (statusCode === 404 ? 'NOT_FOUND' : statusCode === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR');

  console.error(`[Error] RequestId: ${requestId} | Code: ${errorCode} | Message: ${err.message}`);

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: err.message || 'An unexpected error occurred',
      requestId
    }
  });
}
