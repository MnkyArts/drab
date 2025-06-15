# Discord Role Assignment Bot

A Discord bot built with **discord.js** and **Bun** that automatically assigns roles to users through both direct API calls and OAuth authentication. Supports website integration with multiple authentication methods.

## 🚀 Features

- **Automatic Role Assignment**: Assign predefined roles to users via API or OAuth
- **Multiple Authentication Methods**: 
  - Direct API with Discord handles
  - OAuth flow for seamless user verification
- **Multiple Handle Formats**: Support for username, username#discriminator, and user ID
- **Secure API**: API key authentication with rate limiting
- **OAuth Security**: CSRF protection, session management, return URL validation
- **Error Handling**: Comprehensive error handling for all scenarios
- **Modern TypeScript**: Built with TypeScript for better developer experience
- **Production Ready**: Includes logging, monitoring, and security features

## 📋 Prerequisites

- [Bun](https://bun.sh/) (latest stable version)
- Discord Developer Account with access to Discord Developer Portal
- Discord Server with admin permissions
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
# Basic Discord Bot Configuration (Required)
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_server_id_here
DISCORD_ROLE_ID=role_id_to_assign

# API Configuration (Required)
API_PORT=3000
API_SECRET_KEY=your_secure_api_key_here

# OAuth Configuration (Required for OAuth endpoints)
DISCORD_CLIENT_ID=your_oauth_app_client_id
DISCORD_CLIENT_SECRET=your_oauth_app_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
SESSION_SECRET=your_random_session_secret_here
ALLOWED_RETURN_DOMAINS=localhost,yourdomain.com

# Environment
NODE_ENV=development
```

## 🔧 Complete Setup Guide

### Step 1: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give it a name (e.g., "Role Assignment Bot")
4. Navigate to the "Bot" section
5. Click "Add Bot"
6. **Important**: Copy the bot token - you'll need this for your `.env` file

### Step 2: Configure Bot Permissions

In the "Bot" section:
- Enable "Server Members Intent"
- Enable "Message Content Intent" (if you plan to read messages)

In "OAuth2 > URL Generator":
- **Scopes**: Select `bot`
- **Bot Permissions**: Select:
  - ✅ View Channels
  - ✅ Manage Roles
  - ✅ Read Message History

### Step 3: Set Up OAuth (Optional)

If you want to use OAuth authentication:

1. In the Discord Developer Portal, go to OAuth2 > General
2. Add Redirect URI: `http://localhost:3000/auth/discord/callback` (or your production URL)
3. Copy Client ID and Client Secret to your `.env`
4. Required OAuth scopes: `identify`, `guilds`

### Step 4: Add Bot to Your Server

1. Copy the generated OAuth2 URL from the URL Generator
2. Open the URL in your browser
3. Select your Discord server
4. Authorize the bot

### Step 5: Get Required Discord IDs

#### Server ID (Guild ID):
1. Enable Developer Mode in Discord (Settings > App Settings > Advanced > Developer Mode)
2. Right-click your server name
3. Click "Copy Server ID"

#### Role ID:
1. Right-click the role you want to assign
2. Click "Copy Role ID"
3. **Important**: Make sure your bot's role is positioned **above** the role it needs to assign

### Step 6: Generate Secure Keys

Generate a secure API key:
```bash
openssl rand -base64 32
```

Or use Node.js:
```javascript
console.log(require('crypto').randomBytes(32).toString('hex'));
```

### Step 7: Test the Setup

1. Start the bot:
   ```bash
   bun run dev
   ```

2. Check if the bot appears online in your Discord server

3. Test the API health endpoint:
   ```bash
   curl http://localhost:3000/api/health
   ```

## 🔌 API Usage

The bot provides two authentication methods:

1. **Direct API**: Submit Discord handles with API key authentication
2. **OAuth Flow**: Redirect users through Discord OAuth for automatic verification

### Method 1: Direct API Endpoints

#### Assign Role Endpoint

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

#### Response Format

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

#### Other Endpoints

- `GET /` - Bot status and info
- `GET /api/health` - Health check
- `GET /api/info` - API information

### Method 2: OAuth Authentication Flow

#### OAuth Endpoints

**`GET /auth/discord?return_url={encoded_url}`**
Initiates Discord OAuth flow.

**Parameters:**
- `return_url` (required): URL to redirect back to after OAuth completion

**Example:**
```
GET /auth/discord?return_url=https%3A//yourwebsite.com/callback
```

**`GET /auth/discord/callback`**
Internal OAuth callback endpoint. Users should not access this directly.

#### OAuth Flow Process

1. **Your Website → OAuth API**
   ```javascript
   const returnUrl = encodeURIComponent('https://yourwebsite.com/discord-callback');
   window.location.href = `https://yourapi.com/auth/discord?return_url=${returnUrl}`;
   ```

2. **OAuth API → Discord**
   API redirects user to Discord OAuth with proper scopes (`identify`, `guilds`).

3. **Discord → OAuth API**
   Discord redirects back with authorization code.

4. **OAuth API → Your Website**
   API processes OAuth, assigns role, and redirects back:

   **Success:**
   ```
   https://yourwebsite.com/discord-callback?status=success&discord_id=123456789&username=user%231234
   ```

   **Error:**
   ```
   https://yourwebsite.com/discord-callback?status=error&error=not_in_server
   ```

#### OAuth Error Codes

| Error Code | Description |
|------------|-------------|
| `oauth_denied` | User cancelled OAuth authorization |
| `invalid_state` | CSRF validation failed |
| `oauth_failed` | Token exchange with Discord failed |
| `not_in_server` | User not in the target Discord server |
| `already_has_role` | User already has the target role |
| `role_assignment_failed` | Bot permission issues or API errors |
| `api_error` | Internal server error |

## 🌐 Website Integration

### Method 1: Direct API Integration

#### JavaScript Example

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

#### HTML Form Example

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

### Method 2: OAuth Integration

#### JavaScript Example

```javascript
// Initiate OAuth
function startDiscordOAuth() {
    const returnUrl = encodeURIComponent(window.location.origin + '/discord-callback');
    window.location.href = `https://yourapi.com/auth/discord?return_url=${returnUrl}`;
}

// Handle OAuth callback
function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const error = urlParams.get('error');
    const username = urlParams.get('username');
    const discordId = urlParams.get('discord_id');

    if (status === 'success') {
        showSuccess(`Successfully verified as ${decodeURIComponent(username)}! Role assigned.`);
        // Store user info, update UI, etc.
    } else {
        showError(`Verification failed: ${error}`);
        // Handle specific error cases
    }
}

// Call on page load if on callback page
if (window.location.pathname === '/discord-callback') {
    handleOAuthCallback();
}
```

#### React Example

```jsx
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function DiscordCallback() {
    const [searchParams] = useSearchParams();
    
    useEffect(() => {
        const status = searchParams.get('status');
        const error = searchParams.get('error');
        const username = searchParams.get('username');
        
        if (status === 'success') {
            // Handle success
            console.log('Role assigned to:', decodeURIComponent(username));
        } else {
            // Handle error
            console.error('OAuth failed:', error);
        }
    }, [searchParams]);
    
    return <div>Processing Discord verification...</div>;
}

function VerifyButton() {
    const handleVerify = () => {
        const returnUrl = encodeURIComponent(`${window.location.origin}/discord-callback`);
        window.location.href = `https://yourapi.com/auth/discord?return_url=${returnUrl}`;
    };
    
    return <button onClick={handleVerify}>Verify with Discord</button>;
}
```

## 🛡️ Security Features

### API Security
- **API Key Authentication**: All direct API requests require a valid API key
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Validates Discord handle formats
- **CORS Configuration**: Configurable allowed origins
- **Error Handling**: No sensitive information in error responses

### OAuth Security
- **Return URL Validation**: Only domains in `ALLOWED_RETURN_DOMAINS` are permitted
- **CSRF Protection**: Unique state parameter generated per request with session validation
- **Session Security**: Short-lived sessions (5 minutes) with immediate cleanup
- **Secure Cookies**: Secure cookies in production environments
- **Open Redirect Prevention**: Validates URL format and allowed domains

## 🐛 Error Codes

### API Error Codes

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

### OAuth Error Codes

| Error Code | Description |
|------------|-------------|
| `oauth_denied` | User cancelled OAuth authorization |
| `invalid_state` | CSRF validation failed |
| `oauth_failed` | Token exchange with Discord failed |
| `not_in_server` | User not in the target Discord server |
| `already_has_role` | User already has the target role |
| `role_assignment_failed` | Bot permission issues or API errors |
| `api_error` | Internal server error |

## 📁 Project Structure

```
discordhandle/
├── config/
│   ├── bot-config.ts       # Bot and API configuration
│   └── oauth-config.ts     # OAuth configuration
├── handlers/
│   └── role-handler.ts     # Role assignment logic
├── api/
│   └── webhook.ts          # API endpoints
├── middleware/
│   ├── auth.ts             # API authentication & rate limiting
│   └── oauth-middleware.ts # OAuth middleware
├── routes/
│   └── oauth-routes.ts     # OAuth route handlers
├── services/
│   └── role-service.ts     # Role management services
├── utils/
│   └── discord-utils.ts    # Discord utility functions
├── index.ts                # Main application file
├── package.json
├── tsconfig.json
├── .env.example            # Environment template
├── README.md
├── SETUP.md                # Detailed setup guide
└── OAUTH_README.md         # OAuth-specific documentation
```

## 🚀 Deployment

### Production Environment Variables

```env
# Basic Configuration
NODE_ENV=production
API_PORT=3000
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# OAuth Production Settings (if using OAuth)
DISCORD_REDIRECT_URI=https://yourapi.com/auth/discord/callback
ALLOWED_RETURN_DOMAINS=yourwebsite.com,yourwebsite.net
SESSION_SECRET=your_production_session_secret
```

### Discord Application Settings

For OAuth functionality:
- OAuth2 Redirect URI: `https://yourapi.com/auth/discord/callback`
- Required scopes: `identify`, `guilds`

### Process Management

```bash
# Using PM2
npm install -g pm2
pm2 start index.ts --name discord-bot

# Using systemd service
sudo systemctl enable discord-bot
sudo systemctl start discord-bot
```

### Reverse Proxy (nginx example)

```nginx
location /api/ {
  proxy_pass http://localhost:3000/api/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}

location /auth/ {
  proxy_pass http://localhost:3000/auth/;
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

### Security Checklist for Production

- ✅ Use HTTPS in production
- ✅ Set secure session cookies
- ✅ Configure CORS properly
- ✅ Whitelist return domains (OAuth)
- ✅ Use strong session secrets
- ✅ Monitor for abuse
- ✅ Set up proper logging
- ✅ Configure rate limiting

## 🔧 Development

### Available Scripts

```bash
bun run dev     # Development with auto-reload
bun start       # Production start
bun install     # Install dependencies
```

### Testing

#### Automated Tests
```bash
bun run test-basic    # Basic API tests
bun run test-oauth    # OAuth flow tests
bun run test-api      # API endpoint tests
```

#### Manual Testing

**Direct API Testing:**
```bash
curl -X POST http://localhost:3000/api/assign-role \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -d '{"discordHandle": "your_username"}'
```

**OAuth Testing:**
1. Visit: `http://localhost:3000/auth/discord?return_url=http://localhost:3000/test-callback`
2. Complete Discord OAuth
3. Check redirect parameters

### Adding New Features

1. **New API Endpoints**: Add to `api/webhook.ts`
2. **OAuth Routes**: Add to `routes/oauth-routes.ts`
3. **Bot Events**: Add to `index.ts` in `setupDiscordEvents()`
4. **Utility Functions**: Add to `utils/discord-utils.ts`
5. **Configuration**: Modify `config/bot-config.ts` or `config/oauth-config.ts`

## 📊 Monitoring

The bot includes built-in logging for:
- Role assignments (success/failure)
- API requests and responses
- Discord events (member join/leave)
- Error tracking

## 🆘 Troubleshooting

### Common Issues

#### Bot Issues

1. **Bot not responding**:
   - Check bot token validity
   - Verify bot is in the server
   - Check bot permissions

2. **Role assignment fails**:
   - Ensure bot role is above target role
   - Check "Manage Roles" permission
   - Verify role ID is correct

#### API Issues

3. **API authentication errors**:
   - Verify API key in request headers
   - Check environment variable configuration

4. **User not found**:
   - User might not be in the server
   - Handle format might be incorrect
   - Try using user ID instead of username

#### OAuth Issues

5. **"Invalid return_url"**:
   - Check `ALLOWED_RETURN_DOMAINS` configuration
   - Ensure return URL uses allowed domain
   - Verify URL encoding

6. **"Invalid state parameter"**:
   - Check session configuration
   - Ensure sessions are working properly
   - Verify CSRF state generation

7. **OAuth doesn't redirect to Discord**:
   - Verify Discord OAuth app configuration
   - Check CLIENT_ID and REDIRECT_URI
   - Ensure OAuth app has correct scopes

8. **"Role assignment failed" after OAuth**:
   - Check bot permissions
   - Verify role hierarchy
   - Ensure user is in server

### Setup Issues

9. **Bot not appearing online**:
   - Check bot token validity
   - Ensure bot is added to the server
   - Check console for error messages

10. **Permission errors**:
    - Verify bot has "Manage Roles" permission
    - Ensure bot role is above the target role in hierarchy
    - Check that bot is in the same server as the target role

### Debug Mode

Set `NODE_ENV=development` for verbose logging.

### Security Considerations

1. **Keep your bot token secret** - never commit it to version control
2. **Use a strong API key** - generate a random 32+ character string
3. **Use strong session secrets** - generate random secrets for OAuth
4. **Restrict CORS origins** in production to your domain only
5. **Monitor rate limits** to prevent abuse
6. **Use HTTPS** in production environments
7. **Validate return URLs** to prevent open redirects

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
