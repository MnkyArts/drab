# Discord OAuth Role Assignment API

This API provides a headless Discord OAuth service for role assignment. Your website can redirect users to this API, which handles the complete OAuth flow and redirects back with the result.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Set up Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Basic Discord Bot (Required)
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_server_id_here
DISCORD_ROLE_ID=your_role_id_here
API_SECRET_KEY=your_secure_api_key_here

# OAuth Configuration (Required for OAuth endpoints)
DISCORD_CLIENT_ID=your_oauth_app_client_id
DISCORD_CLIENT_SECRET=your_oauth_app_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
SESSION_SECRET=your_random_session_secret_here
ALLOWED_RETURN_DOMAINS=localhost,yourdomain.com
```

### 3. Create Discord OAuth Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or use existing
3. Go to OAuth2 > General
4. Add Redirect URI: `http://localhost:3000/auth/discord/callback`
5. Copy Client ID and Client Secret to your `.env`

### 4. Start the API
```bash
bun run dev
```

## 📋 API Endpoints

### OAuth Endpoints

#### `GET /auth/discord?return_url={encoded_url}`
Initiates Discord OAuth flow.

**Parameters:**
- `return_url` (required): URL to redirect back to after OAuth completion

**Example:**
```
GET /auth/discord?return_url=https%3A//yourwebsite.com/callback
```

#### `GET /auth/discord/callback`
Internal OAuth callback endpoint. Users should not access this directly.

### Webhook Endpoints

#### `POST /api/assign-role`
Direct role assignment via API key.

**Headers:**
- `Content-Type: application/json`
- `X-API-Key: your_api_key`

**Body:**
```json
{
  "discordHandle": "username#1234"
}
```

#### `GET /api/health`
Health check endpoint.

#### `GET /`
API status and endpoint listing.

## 🔄 OAuth Flow

### 1. Your Website → OAuth API
```javascript
const returnUrl = encodeURIComponent('https://yourwebsite.com/discord-callback');
window.location.href = `https://yourapi.com/auth/discord?return_url=${returnUrl}`;
```

### 2. OAuth API → Discord
API redirects user to Discord OAuth with proper scopes (`identify`, `guilds`).

### 3. Discord → OAuth API
Discord redirects back with authorization code.

### 4. OAuth API → Your Website
API processes OAuth, assigns role, and redirects back:

**Success:**
```
https://yourwebsite.com/discord-callback?status=success&discord_id=123456789&username=user%231234
```

**Error:**
```
https://yourwebsite.com/discord-callback?status=error&error=not_in_server
```

## 🔒 Security Features

### Return URL Validation
- Only domains in `ALLOWED_RETURN_DOMAINS` are permitted
- Prevents open redirect vulnerabilities
- Validates URL format

### CSRF Protection
- Unique state parameter generated per request
- State validated on callback
- Session-based state storage

### Session Security
- Short-lived sessions (5 minutes)
- Secure cookies in production
- Immediate session cleanup after redirect

## 📝 Error Codes

| Error Code | Description |
|------------|-------------|
| `oauth_denied` | User cancelled OAuth authorization |
| `invalid_state` | CSRF validation failed |
| `oauth_failed` | Token exchange with Discord failed |
| `not_in_server` | User not in the target Discord server |
| `already_has_role` | User already has the target role |
| `role_assignment_failed` | Bot permission issues or API errors |
| `api_error` | Internal server error |

## 🧪 Testing

### Automated Tests
```bash
bun run test-oauth
```

### Manual Testing
1. Visit: `http://localhost:3000/auth/discord?return_url=http://localhost:3000/test-callback`
2. Complete Discord OAuth
3. Check redirect parameters

### Integration Testing
Test with your website by redirecting to the OAuth endpoint and handling the callback.

## 🌐 Frontend Integration

### JavaScript Example
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

### React Example
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

## 🚀 Production Deployment

### Environment Variables
```bash
# Production OAuth settings
DISCORD_REDIRECT_URI=https://yourapi.com/auth/discord/callback
ALLOWED_RETURN_DOMAINS=yourwebsite.com,yourwebsite.net
NODE_ENV=production
```

### Discord Application Settings
- OAuth2 Redirect URI: `https://yourapi.com/auth/discord/callback`
- Required scopes: `identify`, `guilds`

### Security Checklist
- ✅ Use HTTPS in production
- ✅ Set secure session cookies
- ✅ Configure CORS properly
- ✅ Whitelist return domains
- ✅ Use strong session secrets
- ✅ Monitor for abuse

## 🔧 Configuration

### Discord Bot Permissions
The bot needs:
- ✅ Read Messages
- ✅ Manage Roles
- ✅ View Server Members

### Role Hierarchy
- ✅ Bot's role must be above the target role
- ✅ Bot needs "Manage Roles" permission

### OAuth Scopes
- `identify`: Get user ID and username
- `guilds`: Check server membership

## 📊 Monitoring

### Logs to Monitor
- OAuth initiation attempts
- Failed state validations
- Role assignment failures
- Invalid return URL attempts

### Metrics to Track
- OAuth completion rate
- Role assignment success rate
- Common error types
- Response times

## 🆘 Troubleshooting

### Common Issues

**"Invalid return_url"**
- Check `ALLOWED_RETURN_DOMAINS` configuration
- Ensure return URL uses allowed domain

**"Invalid state parameter"**
- Check session configuration
- Ensure sessions are working properly
- Verify CSRF state generation

**"Role assignment failed"**
- Check bot permissions
- Verify role hierarchy
- Ensure user is in server

**OAuth doesn't redirect to Discord**
- Verify Discord OAuth app configuration
- Check CLIENT_ID and REDIRECT_URI
- Ensure OAuth app has correct scopes

### Debug Mode
Set `NODE_ENV=development` for detailed error logs.

## 📚 Additional Resources

- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
- [Passport.js Documentation](http://www.passportjs.org/docs/)
- [Express Session Documentation](https://github.com/expressjs/session)

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the error codes
3. Test with the included test suite
4. Check Discord Developer Portal settings
