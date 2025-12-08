# Vipps Login Test

This is a test project for Vipps Login OAuth 2.0 authentication. It provides a backend service that handles the OAuth flow with Vipps for user authentication.

## Prerequisites

- Node.js 16.x or later
- npm or yarn
- Vipps developer account (https://portal.vipps.no/)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update with your Vipps credentials:
   ```bash
   cp .env.example .env
   ```
4. Update the following environment variables in `.env`:
   - `VIPPS_CLIENT_ID` - Your Vipps client ID
   - `VIPPS_CLIENT_SECRET` - Your Vipps client secret
   - `VIPPS_SUBSCRIPTION_KEY` - Your Vipps subscription key
   - `VIPPS_MERCHANT_SERIAL_NUMBER` - Your merchant serial number
   - `VIPPS_REDIRECT_URI` - Must match the redirect URI configured in Vipps portal
   - `APP_REDIRECT_SCHEME` - Your app's URL scheme for deep linking
   - `JWT_SECRET` - A random secret key for JWT token signing

## Running the Server

### Development

```bash
npm run dev
```

This will start the server with nodemon for automatic reloading.

### Production

```bash
npm start
```

## API Endpoints

- `GET /auth/vipps/login` - Initiate Vipps login
- `GET /auth/vipps/callback` - Vipps OAuth callback (handled automatically)
- `POST /auth/vipps/session` - Get session info after successful login
- `GET /auth/health` - Health check endpoint

## Environment Variables

- `PORT` - Port to run the server on (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - Secret key for JWT token signing
- `APP_REDIRECT_SCHEME` - Your app's URL scheme for deep linking
- `VIPPS_API_URL` - Vipps API base URL (use https://apitest.vipps.no for testing)
- `VIPPS_CLIENT_ID` - Vipps client ID
- `VIPPS_CLIENT_SECRET` - Vipps client secret
- `VIPPS_SUBSCRIPTION_KEY` - Vipps subscription key
- `VIPPS_MERCHANT_SERIAL_NUMBER` - Vipps merchant serial number
- `VIPPS_REDIRECT_URI` - Callback URL for Vipps OAuth flow

## Security

- Uses Helmet.js for security headers
- JWT tokens for session management
- Environment variables for sensitive configuration
- Input validation and error handling

## License

MIT
# Vipps-test
