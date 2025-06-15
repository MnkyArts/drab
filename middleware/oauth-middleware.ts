import express from 'express';
import session from 'express-session';
import { oauthConfig } from '../config/oauth-config.js';

export interface OAuthUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  guilds?: any[];
}

export interface OAuthRequest extends express.Request {
  user?: OAuthUser;
  session: session.Session & Partial<session.SessionData> & {
    returnUrl?: string;
    csrfState?: string;
  };
}

export function setupOAuthMiddleware(app: express.Application): void {
  // Session middleware
  app.use(session({
    secret: oauthConfig.session.secret,
    resave: oauthConfig.session.resave,
    saveUninitialized: oauthConfig.session.saveUninitialized,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: oauthConfig.session.maxAge
    }
  }));
}

export function validateReturnUrl(returnUrl: string): boolean {
  try {
    const url = new URL(returnUrl);
    const allowedDomains = oauthConfig.security.allowedReturnDomains;
    
    // Check if domain is in allowed list
    return allowedDomains.some(domain => 
      url.hostname === domain || url.hostname.endsWith('.' + domain)
    );
  } catch (error) {
    return false;
  }
}

export function generateCSRFState(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < oauthConfig.security.csrfStateLength; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function buildReturnUrl(baseUrl: string, status: string, data?: Record<string, string>): string {
  const url = new URL(baseUrl);
  url.searchParams.set('status', status);
  
  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  
  return url.toString();
}

export function buildDiscordOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: oauthConfig.discord.clientId,
    redirect_uri: oauthConfig.discord.redirectUri,
    response_type: 'code',
    scope: oauthConfig.discord.scopes.join(' '),
    state: state
  });
  
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<any> {
  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: oauthConfig.discord.clientId,
      client_secret: oauthConfig.discord.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: oauthConfig.discord.redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchDiscordUser(accessToken: string): Promise<OAuthUser> {
  const [userResponse, guildsResponse] = await Promise.all([
    fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
    fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  ]);

  if (!userResponse.ok) {
    throw new Error(`Failed to fetch user: ${userResponse.status}`);
  }

  const user: any = await userResponse.json();
  const guilds: any = guildsResponse.ok ? await guildsResponse.json() : [];

  return {
    id: user.id,
    username: user.username,
    discriminator: user.discriminator,
    avatar: user.avatar,
    guilds: guilds
  };
}
