# Discord Role Assignment Bot - Setup Guide

## Prerequisites

Before setting up the bot, you'll need:

1. **Discord Developer Account**: Access to Discord Developer Portal
2. **Bun Runtime**: Installed on your system
3. **Discord Server**: Where you have admin permissions

## Step-by-Step Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give it a name (e.g., "Role Assignment Bot")
4. Navigate to the "Bot" section
5. Click "Add Bot"
6. **Important**: Copy the bot token - you'll need this for your `.env` file

### 2. Configure Bot Permissions

In the "Bot" section:
- Enable "Server Members Intent"
- Enable "Message Content Intent" (if you plan to read messages)

In "OAuth2 > URL Generator":
- **Scopes**: Select `bot`
- **Bot Permissions**: Select:
  - ✅ View Channels
  - ✅ Manage Roles
  - ✅ Read Message History

### 3. Add Bot to Your Server

1. Copy the generated OAuth2 URL from the URL Generator
2. Open the URL in your browser
3. Select your Discord server
4. Authorize the bot

### 4. Get Required Discord IDs

#### Server ID (Guild ID):
1. Enable Developer Mode in Discord (Settings > App Settings > Advanced > Developer Mode)
2. Right-click your server name
3. Click "Copy Server ID"

#### Role ID:
1. Right-click the role you want to assign
2. Click "Copy Role ID"
3. **Important**: Make sure your bot's role is positioned **above** the role it needs to assign

### 5. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your values:
   ```env
   DISCORD_BOT_TOKEN=your_bot_token_from_step_1
   DISCORD_GUILD_ID=your_server_id_from_step_4
   DISCORD_ROLE_ID=your_role_id_from_step_4
   API_SECRET_KEY=generate_a_secure_random_string
   API_PORT=3000
   NODE_ENV=development
   ```

### 6. Generate Secure API Key

You can generate a secure API key using this command:
```bash
openssl rand -base64 32
```

Or use this JavaScript snippet:
```javascript
console.log(require('crypto').randomBytes(32).toString('hex'));
```

### 7. Test the Setup

1. Start the bot:
   ```bash
   bun run dev
   ```

2. Check if the bot appears online in your Discord server

3. Test the API health endpoint:
   ```bash
   curl http://localhost:3000/api/health
   ```

### 8. Test Role Assignment

Test with curl:
```bash
curl -X POST http://localhost:3000/api/assign-role \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -d '{"discordHandle": "your_username"}'
```

## Troubleshooting

### Bot Not Appearing Online
- Check bot token validity
- Ensure bot is added to the server
- Check console for error messages

### Permission Errors
- Verify bot has "Manage Roles" permission
- Ensure bot role is above the target role in hierarchy
- Check that bot is in the same server as the target role

### API Errors
- Verify API key is correctly set in environment
- Check that the API port is not already in use
- Ensure proper header format in requests

### Role Assignment Fails
- User must be a member of the Discord server
- Bot must have higher role position than target role
- Check user handle format (username, username#1234, or user ID)

## Security Considerations

1. **Keep your bot token secret** - never commit it to version control
2. **Use a strong API key** - generate a random 32+ character string
3. **Restrict CORS origins** in production to your domain only
4. **Monitor rate limits** to prevent abuse
5. **Use HTTPS** in production environments

## Next Steps

Once everything is working:
1. Set up your website integration
2. Configure production environment variables
3. Set up process management (PM2, systemd, etc.)
4. Configure reverse proxy if needed
5. Set up monitoring and logging

## Getting Help

If you encounter issues:
1. Check the bot logs for error messages
2. Verify all environment variables are set correctly
3. Test each component individually (bot connection, API endpoints, role permissions)
4. Review the Discord audit log for permission issues
