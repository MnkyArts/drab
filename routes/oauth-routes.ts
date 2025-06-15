import express from 'express';
import { RoleService } from '../services/role-service.js';
import { 
  validateReturnUrl, 
  generateCSRFState, 
  buildReturnUrl,
  buildDiscordOAuthUrl,
  exchangeCodeForTokens,
  fetchDiscordUser,
  type OAuthRequest 
} from '../middleware/oauth-middleware.js';

export function createOAuthRouter(roleService: RoleService) {
  const router = express.Router();

  // Initiate Discord OAuth flow
  router.get('/discord', (req: express.Request, res: express.Response) => {
    const oauthReq = req as OAuthRequest;
    const { return_url } = req.query;

    // Validate return URL
    if (!return_url || typeof return_url !== 'string' || !validateReturnUrl(return_url)) {
      return res.status(400).send('Invalid or missing return_url parameter');
    }

    // Generate CSRF state
    const csrfState = generateCSRFState();

    // Store return URL and CSRF state in session
    oauthReq.session.returnUrl = return_url;
    oauthReq.session.csrfState = csrfState;

    // Redirect to Discord OAuth with state parameter
    const discordOAuthUrl = buildDiscordOAuthUrl(csrfState);
    res.redirect(discordOAuthUrl);
  });

  // Handle Discord OAuth callback
  router.get('/discord/callback', async (req: express.Request, res: express.Response) => {
    const oauthReq = req as OAuthRequest;
    const { state, code, error } = req.query;

    // Handle OAuth error from Discord
    if (error) {
      const returnUrl = oauthReq.session.returnUrl;
      oauthReq.session.destroy(() => {});
      
      if (returnUrl) {
        return res.redirect(buildReturnUrl(returnUrl, 'error', { error: 'oauth_denied' }));
      }
      return res.status(400).send('OAuth denied');
    }

    // Validate CSRF state
    if (!state || state !== oauthReq.session.csrfState) {
      const returnUrl = oauthReq.session.returnUrl;
      oauthReq.session.destroy(() => {});
      
      if (returnUrl) {
        return res.redirect(buildReturnUrl(returnUrl, 'error', { error: 'invalid_state' }));
      }
      return res.status(400).send('Invalid state parameter');
    }

    // Validate authorization code
    if (!code || typeof code !== 'string') {
      const returnUrl = oauthReq.session.returnUrl;
      oauthReq.session.destroy(() => {});
      
      if (returnUrl) {
        return res.redirect(buildReturnUrl(returnUrl, 'error', { error: 'oauth_failed' }));
      }
      return res.status(400).send('Missing authorization code');
    }

    const returnUrl = oauthReq.session.returnUrl;
    
    // Clear session immediately
    oauthReq.session.destroy(() => {});

    try {
      // Exchange code for access token
      const tokens = await exchangeCodeForTokens(code);
      
      // Fetch user data from Discord
      const user = await fetchDiscordUser(tokens.access_token);

      // Assign role to the authenticated user
      const roleResult = await roleService.assignRoleToOAuthUser(user);

      if (roleResult.success && roleResult.user) {
        if (returnUrl) {
          return res.redirect(buildReturnUrl(returnUrl, 'success', {
            discord_id: roleResult.user.discord_id,
            username: encodeURIComponent(roleResult.user.username)
          }));
        }
        return res.send('Role assigned successfully!');
      } else {
        if (returnUrl) {
          return res.redirect(buildReturnUrl(returnUrl, 'error', { 
            error: roleResult.error || 'role_assignment_failed' 
          }));
        }
        return res.status(400).send(`Role assignment failed: ${roleResult.error}`);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      if (returnUrl) {
        return res.redirect(buildReturnUrl(returnUrl, 'error', { error: 'api_error' }));
      }
      return res.status(500).send('Internal server error');
    }
  });

  return router;
}
