import express from 'express';
import type { Request, Response } from 'express';
import { RoleHandler } from '../handlers/role-handler.js';
import { authenticateAPI, rateLimitMiddleware } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export function createWebhookRouter(roleHandler: RoleHandler) {
  const router = express.Router();

  // Apply middleware
  router.use(rateLimitMiddleware);
  router.use(authenticateAPI);

  // Role assignment endpoint
  router.post('/assign-role', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { discordHandle } = req.body;

      // Validate request body
      if (!discordHandle) {
        return res.status(400).json({
          success: false,
          message: 'Discord handle is required',
          error: 'MISSING_DISCORD_HANDLE'
        });
      }

      if (typeof discordHandle !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Discord handle must be a string',
          error: 'INVALID_DISCORD_HANDLE_TYPE'
        });
      }

      // Validate Discord handle format
      if (!roleHandler.isValidDiscordHandle(discordHandle.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Discord handle format',
          error: 'INVALID_DISCORD_HANDLE_FORMAT'
        });
      }

      // Assign the role
      const result = await roleHandler.assignRole(discordHandle.trim());

      // Return appropriate status code based on result
      const statusCode = result.success ? 200 : 
                        result.error === 'USER_NOT_FOUND' ? 404 :
                        result.error === 'ROLE_ALREADY_ASSIGNED' ? 409 :
                        result.error === 'INSUFFICIENT_PERMISSIONS' || 
                        result.error === 'ROLE_HIERARCHY_ERROR' ? 403 : 500;

      res.status(statusCode).json(result);

    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  });

  // Health check endpoint
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString()
    });
  });

  // API info endpoint
  router.get('/info', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Discord Role Assignment API',
      version: '1.0.0',
      endpoints: {
        'POST /assign-role': 'Assign role to Discord user',
        'GET /health': 'Health check',
        'GET /info': 'API information'
      }
    });
  });

  return router;
}
