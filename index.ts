import 'dotenv/config';
import { Client } from 'discord.js';
import express from 'express';
import cors from 'cors';
import { botConfig, apiConfig, discord, api } from './config/bot-config.js';
import { RoleHandler } from './handlers/role-handler.js';
import { createWebhookRouter } from './api/webhook.js';
import { DiscordUtils } from './utils/discord-utils.js';

class DiscordRoleBot {
  private client: Client;
  private roleHandler: RoleHandler;
  private app: express.Application;

  constructor() {
    this.client = new Client(botConfig);
    this.roleHandler = new RoleHandler(this.client);
    this.app = express();
    this.setupExpress();
    this.setupDiscordEvents();
  }

  private setupExpress(): void {
    // Middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS configuration
    this.app.use(cors({
      origin: apiConfig.corsOrigins,
      credentials: true,
      optionsSuccessStatus: 200
    }));

    // Trust proxy for rate limiting
    this.app.set('trust proxy', 1);

    // API routes
    this.app.use('/api', createWebhookRouter(this.roleHandler));

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Discord Role Assignment Bot API',
        version: '1.0.0',
        status: 'online',
        bot: {
          connected: this.client.isReady(),
          username: this.client.user?.username || 'Not connected'
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        error: 'NOT_FOUND'
      });
    });

    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Express error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    });
  }

  private setupDiscordEvents(): void {
    this.client.once('ready', async () => {
      console.log('🤖 Discord bot is ready!');
      console.log(`📝 Logged in as: ${this.client.user?.tag}`);
      console.log(`🏠 Serving ${this.client.guilds.cache.size} guild(s)`);

      try {
        await this.roleHandler.initialize();
        console.log('✅ Role handler initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize role handler:', error);
        process.exit(1);
      }
    });

    this.client.on('error', (error) => {
      console.error('Discord client error:', error);
    });

    this.client.on('warn', (warning) => {
      console.warn('Discord client warning:', warning);
    });

    this.client.on('guildMemberAdd', (member) => {
      console.log(`👋 New member joined: ${member.user.tag} (${member.id})`);
    });

    this.client.on('guildMemberRemove', (member) => {
      console.log(`👋 Member left: ${member.user?.tag || 'Unknown'} (${member.id})`);
    });
  }

  public async start(): Promise<void> {
    try {
      // Validate environment variables
      this.validateEnvironment();

      // Start Discord client
      console.log('🔐 Logging into Discord...');
      await this.client.login(discord.token);

      // Start Express server
      console.log(`🚀 Starting API server on port ${api.port}...`);
      this.app.listen(api.port, () => {
        console.log(`✅ API server running on http://localhost:${api.port}`);
        console.log(`📡 Webhook endpoint: http://localhost:${api.port}/api/assign-role`);
        this.printUsageInstructions();
      });

    } catch (error) {
      console.error('❌ Failed to start the bot:', error);
      process.exit(1);
    }
  }

  private validateEnvironment(): void {
    const required = [
      'DISCORD_BOT_TOKEN',
      'DISCORD_GUILD_ID', 
      'DISCORD_ROLE_ID',
      'API_SECRET_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(key => console.error(`   - ${key}`));
      console.error('\n💡 Please copy .env.example to .env and fill in the values');
      process.exit(1);
    }

    // Validate Discord IDs are valid snowflakes
    if (!DiscordUtils.isValidSnowflake(discord.guildId!)) {
      console.error('❌ Invalid DISCORD_GUILD_ID format');
      process.exit(1);
    }

    if (!DiscordUtils.isValidSnowflake(discord.roleId!)) {
      console.error('❌ Invalid DISCORD_ROLE_ID format');
      process.exit(1);
    }

    console.log('✅ Environment validation passed');
  }

  private printUsageInstructions(): void {
    console.log('\n📖 Usage Instructions:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔗 API Endpoints:');
    console.log(`   GET  http://localhost:${api.port}/              - Bot status`);
    console.log(`   GET  http://localhost:${api.port}/api/health     - Health check`);
    console.log(`   GET  http://localhost:${api.port}/api/info       - API info`);
    console.log(`   POST http://localhost:${api.port}/api/assign-role - Assign role`);
    
    console.log('\n📋 Example Request:');
    console.log('   curl -X POST http://localhost:' + api.port + '/api/assign-role \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -H "X-API-Key: YOUR_API_KEY" \\');
    console.log('     -d \'{"discordHandle": "username#1234"}\'');
    
    console.log('\n🔑 API Key:');
    console.log(`   Your API key: ${api.secretKey}`);
    
    console.log('\n🎯 Target Role ID: ' + discord.roleId);
    console.log('🏠 Target Guild ID: ' + discord.guildId);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down...');
    this.client.destroy();
    process.exit(0);
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT signal');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM signal');
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Start the bot
const bot = new DiscordRoleBot();
bot.start().catch(console.error);