# Vipps Login Backend - Simple Testing Guide

## Base URL
```
https://vipps-test-production.up.railway.app
```

---

## API Endpoints

### 1. Health Check
```
GET https://vipps-test-production.up.railway.app/auth/health
```
**Returns:** `{"status":"ok","timestamp":"..."}`

---

### 2. Start Login
```
GET https://vipps-test-production.up.railway.app/auth/vipps/login
```
**Returns:** 
```json
{
  "authUrl": "https://apitest.vipps.no/...",
  "sessionId": "abc-123-xyz"
}
```
**Note:** Save the `sessionId` and open the `authUrl` in Safari

---

### 3. Get User Data & JWT
```
POST https://vipps-test-production.up.railway.app/auth/vipps/session
Content-Type: application/json

{
  "sessionId": "abc-123-xyz"
}
```
**Returns:**
```json
{
  "token": "eyJhbG...",
  "user": {
    "name": "Test User",
    "email": "test@example.com",
    "phoneNumber": "+4712345678"
  }
}
```

---

## Testing Flow

1. **Call** `/auth/vipps/login` → Get `authUrl` and `sessionId`
2. **Open** the `authUrl` in Safari → Login with Vipps MT app
3. **App redirects** to `vippsMT://auth/callback?success=true&sessionId=xxx`
4. **Call** `/auth/vipps/session` with the `sessionId` → Get JWT token and user data

---

## Quick Test (cURL)

```bash
# Step 1: Start login
curl https://vipps-test-production.up.railway.app/auth/vipps/login

# Step 2: Open authUrl in browser and complete login

# Step 3: Get token (replace SESSION_ID)
curl -X POST https://vipps-test-production.up.railway.app/auth/vipps/session \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID"}'
```

---

## iOS Deep Link Setup

Add to `Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>vippsMT</string>
        </array>
    </dict>
</array>
```

Done! 🎉