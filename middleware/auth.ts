import type { Request, Response, NextFunction } from 'express';
import { api } from '../config/bot-config.js';

export interface AuthenticatedRequest extends Request {
  isAuthenticated?: boolean;
}

export const authenticateAPI = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for API key in headers
    const apiKey = req.headers['x-api-key'] || 
                   req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required',
        error: 'MISSING_API_KEY'
      });
    }

    if (apiKey !== api.secretKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key',
        error: 'INVALID_API_KEY'
      });
    }

    req.isAuthenticated = true;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: 'AUTH_ERROR'
    });
  }
};

// Rate limiting middleware
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // max requests per window

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  const clientData = requestCounts.get(clientIP);
  
  if (!clientData || now > clientData.resetTime) {
    // New window or client
    requestCounts.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    next();
  } else if (clientData.count >= RATE_LIMIT_MAX) {
    // Rate limit exceeded
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  } else {
    // Increment counter
    clientData.count++;
    next();
  }
};
