# # Discord Role Assignment Bot

A Discord bot built with **discord.js** and **Bun** that automatically assigns roles to users when they submit their Discord handle through a website form.

## 🚀 Features

- **Automatic Role Assignment**: Assign predefined roles to users via API
- **Multiple Handle Formats**: Support for username, username#discriminator, and user ID
- **Secure API**: API key authentication with rate limiting
- **Error Handling**: Comprehensive error handling for all scenarios
- **Modern TypeScript**: Built with TypeScript for better developer experience
- **Production Ready**: Includes logging, monitoring, and security features

## 📋 Prerequisites

- [Bun](https://bun.sh/) (latest stable version)
- Discord Bot Token and Server Setup
- Node.js knowledge (optional, but helpful)

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd discordhandle
bun install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_server_id_here
DISCORD_ROLE_ID=role_id_to_assign

# API Configuration
API_PORT=3000
API_SECRET_KEY=your_secure_api_key_here

# Environment
NODE_ENV=development
```

### 3. Discord Bot Setup

1. **Create Discord Application**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to "Bot" section and create a bot
   - Copy the bot token to your `.env` file

2. **Bot Permissions**:
   - In the "Bot" section, enable required intents:
     - Server Members Intent
     - Message Content Intent (if needed)
   - In "OAuth2 > URL Generator":
     - Scopes: `bot`
     - Bot Permissions: `Manage Roles`, `View Channels`, `Read Message History`

3. **Add Bot to Server**:
   - Use the generated OAuth2 URL to add the bot to your server
   - Ensure the bot role is positioned above the role it needs to assign

### 4. Get Discord IDs

- **Server ID (Guild ID)**:
  - Enable Developer Mode in Discord
  - Right-click your server → "Copy Server ID"

- **Role ID**:
  - Right-click the role → "Copy Role ID"

### 5. Run the Bot

```bash
# Development
bun run dev

# Production
bun start
```

## 🔌 API Usage

### Assign Role Endpoint

**POST** `/api/assign-role`

**Headers:**
```
Content-Type: application/json
X-API-Key: your_secure_api_key_here
```

**Body:**
```json
{
  "discordHandle": "username#1234"
}
```

**Supported Handle Formats:**
- `username` - Discord username
- `username#1234` - Username with discriminator
- `123456789012345678` - User ID (snowflake)

### Response Format

**Success (200):**
```json
{
  "success": true,
  "message": "Role assigned successfully",
  "data": {
    "userId": "123456789012345678",
    "username": "testuser",
    "roleName": "Member"
  }
}
```

**Error Examples:**
```json
{
  "success": false,
  "message": "User not found in the server",
  "error": "USER_NOT_FOUND"
}
```

### Other Endpoints

- `GET /` - Bot status and info
- `GET /api/health` - Health check
- `GET /api/info` - API information

## 🌐 Website Integration

### JavaScript Example

```javascript
async function assignDiscordRole(discordHandle) {
  try {
    const response = await fetch('/api/assign-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'your_secure_api_key_here'
      },
      body: JSON.stringify({
        discordHandle: discordHandle
      })
    });

    const result = await response.json();
    
    if (result.success) {
      showSuccess(`Role assigned to ${result.data.username}!`);
    } else {
      showError(result.message);
    }
  } catch (error) {
    showError('Failed to assign role. Please try again.');
  }
}
```

### HTML Form Example

```html
<form id="discord-form">
  <input 
    type="text" 
    id="discord-handle" 
    placeholder="Enter Discord username or ID"
    required
  >
  <button type="submit">Assign Role</button>
</form>

<script>
document.getElementById('discord-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const handle = document.getElementById('discord-handle').value;
  await assignDiscordRole(handle);
});
</script>
```

## 🛡️ Security Features

- **API Key Authentication**: All requests require a valid API key
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Validates Discord handle formats
- **CORS Configuration**: Configurable allowed origins
- **Error Handling**: No sensitive information in error responses

## 🐛 Error Codes

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `MISSING_API_KEY` | API key not provided | 401 |
| `INVALID_API_KEY` | Invalid API key | 401 |
| `MISSING_DISCORD_HANDLE` | Discord handle not provided | 400 |
| `INVALID_DISCORD_HANDLE_FORMAT` | Invalid handle format | 400 |
| `USER_NOT_FOUND` | User not in server | 404 |
| `ROLE_ALREADY_ASSIGNED` | User already has role | 409 |
| `INSUFFICIENT_PERMISSIONS` | Bot lacks permissions | 403 |
| `ROLE_HIERARCHY_ERROR` | Role hierarchy issue | 403 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |

## 📁 Project Structure

```
discordhandle/
├── config/
│   └── bot-config.ts       # Bot and API configuration
├── handlers/
│   └── role-handler.ts     # Role assignment logic
├── api/
│   └── webhook.ts          # API endpoints
├── middleware/
│   └── auth.ts             # Authentication & rate limiting
├── utils/
│   └── discord-utils.ts    # Discord utility functions
├── index.ts                # Main application file
├── package.json
├── tsconfig.json
├── .env.example            # Environment template
└── README.md
```

## 🚀 Deployment

### Production Environment

1. **Environment Variables**:
   ```env
   NODE_ENV=production
   API_PORT=3000
   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

2. **Process Management**:
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start index.ts --name discord-bot

   # Using systemd service
   sudo systemctl enable discord-bot
   sudo systemctl start discord-bot
   ```

3. **Reverse Proxy** (nginx example):
   ```nginx
   location /api/ {
     proxy_pass http://localhost:3000/api/;
     proxy_set_header Host $host;
     proxy_set_header X-Real-IP $remote_addr;
   }
   ```

### Docker Deployment

```dockerfile
FROM oven/bun:latest

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install

COPY . .
EXPOSE 3000
CMD ["bun", "start"]
```

## 🔧 Development

### Available Scripts

```bash
bun run dev     # Development with auto-reload
bun start       # Production start
bun install     # Install dependencies
```

### Adding New Features

1. **New API Endpoints**: Add to `api/webhook.ts`
2. **Bot Events**: Add to `index.ts` in `setupDiscordEvents()`
3. **Utility Functions**: Add to `utils/discord-utils.ts`
4. **Configuration**: Modify `config/bot-config.ts`

## 📊 Monitoring

The bot includes built-in logging for:
- Role assignments (success/failure)
- API requests and responses
- Discord events (member join/leave)
- Error tracking

## 🆘 Troubleshooting

### Common Issues

1. **Bot not responding**:
   - Check bot token validity
   - Verify bot is in the server
   - Check bot permissions

2. **Role assignment fails**:
   - Ensure bot role is above target role
   - Check "Manage Roles" permission
   - Verify role ID is correct

3. **API authentication errors**:
   - Verify API key in request headers
   - Check environment variable configuration

4. **User not found**:
   - User might not be in the server
   - Handle format might be incorrect
   - Try using user ID instead of username

### Debug Mode

Set `NODE_ENV=development` for verbose logging.

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Create an issue with detailed information

---

Built with ❤️ using [Bun](https://bun.sh/) and [discord.js](https://discord.js.org/)

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.11. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
