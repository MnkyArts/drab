import { GatewayIntentBits } from 'discord.js';

export const botConfig = {
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ],
  partials: [],
  presence: {
    status: 'online' as const,
    activities: [{
      name: 'Role Assignment Service',
      type: 4 // Custom status
    }]
  }
};

export const apiConfig = {
  port: parseInt(process.env.API_PORT || '3000'),
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  rateLimits: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100 // limit each IP to 100 requests per windowMs
  }
};

export const discord = {
  token: process.env.DISCORD_BOT_TOKEN,
  guildId: process.env.DISCORD_GUILD_ID,
  roleId: process.env.DISCORD_ROLE_ID
};

export const api = {
  secretKey: process.env.API_SECRET_KEY,
  port: parseInt(process.env.API_PORT || '3000')
};
