# Vipps OAuth Flow Debugging Guide

## Your Flow Issue: 404 Error on Callback

Based on your description, the 404 error is likely happening at **Step 3** when Vipps redirects back to Safari with the callback URL.

### Understanding Your Flow

```
1. App → /auth/vipps/login → Server returns authUrl + sessionId
2. App opens authUrl in Safari
3. Safari → Vipps Test MT app (user signs in and approves)
4. Vipps → Safari → Server callback endpoint
5. Server → Redirects to app with vippsMT://auth/callback?success=true&sessionId=XXX
6. ❌ 404 ERROR HERE
```

## Where the 404 Comes From

The 404 is **NOT** from your backend server. It's happening because:

1. **Server successfully processes the callback** (Step 4)
2. **Server generates the redirect URL** to your app: `vippsMT://auth/callback?success=true&sessionId=XXX`
3. **Safari tries to open the deep link** but your iOS app doesn't have a handler for it
4. **Safari shows 404** because the URL scheme isn't registered in your app

## Solution: Register Deep Link Handler in Your iOS App

### For SwiftUI:

```swift
.onOpenURL { url in
    // Handle vippsMT://auth/callback?success=true&sessionId=XXX
    if url.scheme == "vippsMT" && url.host == "auth" {
        let components = URLComponents(url: url, resolvingAgainstBaseURL: true)
        let success = components?.queryItems?.first(where: { $0.name == "success" })?.value
        let sessionId = components?.queryItems?.first(where: { $0.name == "sessionId" })?.value
        let error = components?.queryItems?.first(where: { $0.name == "error" })?.value
        
        // Handle the callback
        if success == "true", let sessionId = sessionId {
            // Fetch user session from server
            fetchSession(sessionId: sessionId)
        } else {
            // Show error
            showError(error ?? "Authentication failed")
        }
    }
}
```

### For UIKit:

```swift
func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    if url.scheme == "vippsMT" && url.host == "auth" {
        let components = URLComponents(url: url, resolvingAgainstBaseURL: true)
        let success = components?.queryItems?.first(where: { $0.name == "success" })?.value
        let sessionId = components?.queryItems?.first(where: { $0.name == "sessionId" })?.value
        
        if success == "true", let sessionId = sessionId {
            // Handle successful auth
            NotificationCenter.default.post(name: NSNotification.Name("VippsAuthSuccess"), object: sessionId)
        }
        return true
    }
    return false
}
```

### Register URL Scheme in Info.plist:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.yourcompany.yourapp</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>vippsMT</string>
        </array>
    </dict>
</array>
```

## Server-Side Verification

To verify your server is working correctly:

### 1. Check Server Logs

When the callback happens, you should see:
```
=== VIPPS CALLBACK RECEIVED ===
Timestamp: 2025-12-11T...
Query Parameters: { code: '***', state: 'xxx-xxx-xxx', error: undefined, error_description: undefined }
APP_REDIRECT_SCHEME: vippsMT
Full URL: https://vipps-test-production.up.railway.app/auth/vipps/callback?code=...&state=...
Session lookup result: Found session xxx-xxx-xxx
Exchanging code for tokens...
✓ Tokens received
Fetching user info...
✓ User info retrieved: 47xxxxxxxx
✓ Session updated with user data
Redirecting to app: vippsMT://auth/callback?success=true&sessionId=xxx-xxx-xxx
=== CALLBACK COMPLETE ===
```

### 2. Test the Session Endpoint

After successful callback, test:
```bash
curl https://vipps-test-production.up.railway.app/auth/session/{sessionId}
```

Should return:
```json
{
  "success": true,
  "user": {
    "sub": "47xxxxxxxx",
    "name": "Test User",
    "phoneNumber": "+47xxxxxxxx",
    "email": "test@example.com"
  },
  "authenticated": true
}
```

## Testing Checklist

- [ ] Verify `.env` has correct `APP_REDIRECT_SCHEME=vippsMT`
- [ ] Verify `.env` has correct `VIPPS_REDIRECT_URI`
- [ ] Check Vipps portal - confirm redirect URI matches exactly
- [ ] iOS app has `vippsMT` URL scheme registered in Info.plist
- [ ] iOS app has `.onOpenURL` or `application(_:open:options:)` handler
- [ ] Server logs show "=== CALLBACK COMPLETE ===" message
- [ ] Test `/auth/session/{sessionId}` endpoint returns user data

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 404 in Safari after Vipps login | App doesn't handle `vippsMT://` scheme | Register URL scheme in Info.plist |
| "Invalid or expired state" error | Session expired (>10 min) | Reduce time between login and approval |
| "Missing authorization code" | Vipps didn't send code parameter | Check Vipps portal settings |
| Server returns 500 error | Token exchange failed | Check VIPPS_CLIENT_SECRET and subscription key |

## Running the Test Script

```bash
node test-oauth-flow.js
```

This will:
1. Call `/auth/vipps/login` and show you the auth URL
2. Print instructions for manual testing
3. Show you what the callback redirect will look like
