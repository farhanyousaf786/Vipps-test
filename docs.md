# Vipps Login - iOS Integration Guide

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

---

## iOS Integration

### 1. Configure Info.plist
Add these entries to your `Info.plist`:

```xml
<!-- Required for deep linking -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>vippsMT</string>
        </array>
    </dict>
</array>

<!-- Required for iOS 9+ -->
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>vippsMT</string>
</array>
```

### 2. Create VippsManager
```swift
import AuthenticationServices

class VippsManager: NSObject {
    static let shared = VippsManager()
    private var authSession: ASWebAuthenticationSession?
    
    func startLogin(completion: @escaping (Result<User, Error>) -> Void) {
        // 1. Get login URL from backend
        guard let url = URL(string: "https://vipps-test-production.up.railway.app/auth/vipps/login") else { 
            return 
        }
        
        // 2. Create and start auth session
        authSession = ASWebAuthenticationSession(
            url: url,
            callbackURLScheme: "vippsMT"
        ) { [weak self] callbackURL, error in
            // 3. Handle callback
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let callbackURL = callbackURL,
                  let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: true),
                  let sessionId = components.queryItems?.first(where: { $0.name == "sessionId" })?.value else {
                completion(.failure(NSError(domain: "VippsError", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid callback"])))
                return
            }
            
            // 4. Verify session with backend
            self?.verifySession(sessionId: sessionId, completion: completion)
        }
        
        // 5. Present Vipps login
        authSession?.presentationContextProvider = self
        authSession?.prefersEphemeralWebBrowserSession = true
        authSession?.start()
    }
    
    private func verifySession(sessionId: String, completion: @escaping (Result<User, Error>) -> Void) {
        var request = URLRequest(url: URL(string: "https://vipps-test-production.up.railway.app/auth/vipps/session")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: String] = ["sessionId": sessionId]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, _, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let userData = json["user"] as? [String: Any],
                  let token = json["token"] as? String else {
                completion(.failure(NSError(domain: "VippsError", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])))
                return
            }
            
            // Save token and user data
            UserDefaults.standard.set(token, forKey: "authToken")
            let user = User(from: userData)
            completion(.success(user))
        }.resume()
    }
}

extension VippsManager: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return UIApplication.shared.windows.first { $0.isKeyWindow } ?? UIWindow()
    }
}

// User model
struct User {
    let name: String
    let email: String
    let phoneNumber: String
    
    init?(from dict: [String: Any]) {
        guard let name = dict["name"] as? String,
              let email = dict["email"] as? String,
              let phoneNumber = dict["phoneNumber"] as? String else {
            return nil
        }
        self.name = name
        self.email = email
        self.phoneNumber = phoneNumber
    }
}

### 3. Usage in ViewController
```swift
class LoginViewController: UIViewController {
    @IBAction func loginWithVippsTapped() {
        VippsManager.shared.startLogin { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let user):
                    print("Logged in as: \(user.name)")
                    // Navigate to home screen
                    self?.navigateToHome()
                case .failure(let error):
                    print("Login failed: \(error.localizedDescription)")
                    // Show error alert
                    self?.showError(error.localizedDescription)
                }
            }
        }
    }
    
    private func navigateToHome() {
        // Your navigation code here
    }
    
    private func showError(_ message: String) {
        let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

## Testing the Integration

1. Tap the Vipps login button in your app
2. The Vipps app will open (if installed) or show a web view
3. Complete the login in Vipps
4. The app will automatically return with the user data
5. The user will be logged in and navigated to the home screen

## Troubleshooting

- **App doesn't return after login**: Verify `CFBundleURLSchemes` in Info.plist
- **Session errors**: Check that the session ID is being passed correctly
- **Network issues**: Ensure the device has internet connectivity
- **Server errors**: Check the server logs for any backend issues

## Next Steps

- Implement token refresh logic
- Add loading indicators during authentication
- Handle session expiration
- Implement logout functionality

Done! 🚀