export const oauthConfig = {
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    redirectUri: process.env.DISCORD_REDIRECT_URI!,
    scopes: ['identify', 'guilds']
  },
  session: {
    secret: process.env.SESSION_SECRET!,
    maxAge: 5 * 60 * 1000, // 5 minutes
    resave: false,
    saveUninitialized: false
  },
  security: {
    allowedReturnDomains: process.env.ALLOWED_RETURN_DOMAINS?.split(',') || [],
    csrfStateLength: 32
  }
};

export function validateOAuthEnvironment(): void {
  const required = [
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET', 
    'DISCORD_REDIRECT_URI',
    'SESSION_SECRET',
    'ALLOWED_RETURN_DOMAINS'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required OAuth environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    throw new Error('Missing OAuth environment variables');
  }

  console.log('✅ OAuth environment validation passed');
}
