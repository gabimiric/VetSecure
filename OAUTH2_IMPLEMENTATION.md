# Google OAuth2 Implementation - Complete Documentation

## ✅ Implementation Status

**OAuth2 is FULLY IMPLEMENTED and ready to use!** All code is in place. You only need to configure credentials.

---

## 📋 FILES MODIFIED/CREATED

### Backend Files

1. **`src/main/java/com/vetsecure/backend/security/oauth2/CustomOAuth2UserService.java`**
   - Loads Google user info
   - Auto-creates users if email doesn't exist
   - Links Google identity to existing users by email
   - Sets `authProvider=GOOGLE` and stores `googleSub`

2. **`src/main/java/com/vetsecure/backend/security/oauth2/OAuth2LoginSuccessHandler.java`**
   - Issues JWT token after successful Google login
   - Handles MFA if enabled (same flow as classic auth)
   - Redirects to frontend with token in query param: `?token=<jwt>`

3. **`src/main/java/com/vetsecure/backend/security/oauth2/OAuth2LoginFailureHandler.java`**
   - Redirects to frontend with error: `?error=oauth2_failed`

4. **`src/main/java/com/vetsecure/backend/security/SecurityConfig.java`**
   - Added OAuth2 filter chain (Order 0) for `/oauth2/**` endpoints
   - Preserves existing JWT filter chain (Order 1) for API endpoints
   - Both chains coexist - OAuth2 is additive, not replacing classic auth

5. **`src/main/java/com/vetsecure/backend/model/User.java`**
   - Added `authProvider` field (enum: LOCAL, GOOGLE)
   - Added `googleSub` field (Google stable user ID)

6. **`src/main/java/com/vetsecure/backend/model/AuthProvider.java`**
   - Enum: `LOCAL`, `GOOGLE`

7. **`src/main/resources/application-google.properties`**
   - OAuth2 configuration (activated via `google` profile)

8. **`pom.xml`**
   - Already includes `spring-boot-starter-oauth2-client` dependency

### Frontend Files

1. **`frontend/src/pages/auth/LoginPage.jsx`**
   - Added "Sign in with Google" button linking to `/oauth2/authorization/google`
   - Added OAuth2 callback handler (reads `?token=...` from URL)
   - Calls `completeLogin(token)` to set auth state
   - Handles MFA redirect (`?mfaRequired=true&mfaToken=...`)
   - Handles errors (`?error=...`)

---

## 🔧 WHAT YOU MUST FILL MANUALLY

### Step 1: Set Environment Variables

Before starting the backend, set these environment variables:

```bash
export GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret-here"
export APP_OAUTH2_REDIRECT_URI="http://localhost:8080/login"  # Optional, defaults to this
```

**OR** add to `docker-compose.yml` environment section:
```yaml
environment:
  GOOGLE_CLIENT_ID: "your-client-id-here.apps.googleusercontent.com"
  GOOGLE_CLIENT_SECRET: "your-client-secret-here"
  APP_OAUTH2_REDIRECT_URI: "http://localhost:8080/login"
  SPRING_PROFILES_ACTIVE: "default,google"
```

### Step 2: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **"VetSecure"**
3. Navigate to: **APIs & Services > Credentials**
4. Find your **Web OAuth Client ID**
5. **CRITICAL**: Add this Authorized redirect URI:
   ```
   http://localhost:8082/login/oauth2/code/google
   ```
   ⚠️ **Note**: This is the **BACKEND** URL (port 8082), NOT the frontend (8080).
   Spring Security handles the OAuth2 callback on the backend, then redirects to frontend.

### Step 3: Activate Google Profile

Add to `src/main/resources/application.properties`:
```properties
spring.profiles.active=default,google
```

**OR** set environment variable:
```bash
export SPRING_PROFILES_ACTIVE=default,google
```

**OR** in `docker-compose.yml`:
```yaml
environment:
  SPRING_PROFILES_ACTIVE: "default,google"
```

---

## 🔄 LOGIN FLOW EXPLANATION

### Email/Password Login (Unchanged)
1. User enters username/email + password
2. Frontend calls `POST /api/auth/login`
3. Backend validates credentials, checks MFA
4. Returns JWT token
5. Frontend stores token and redirects to dashboard

### Google OAuth2 Login (New)
1. User clicks "Sign in with Google" button
2. Browser redirects to: `http://localhost:8082/oauth2/authorization/google`
3. Spring Security redirects to Google consent screen
4. User approves on Google
5. Google redirects back to: `http://localhost:8082/login/oauth2/code/google` (backend)
6. `CustomOAuth2UserService` processes user (find or create)
7. `OAuth2LoginSuccessHandler` issues JWT token
8. Backend redirects to: `http://localhost:8080/login?token=<jwt>` (frontend)
9. Frontend `LoginPage` reads `token` from URL, calls `completeLogin(token)`
10. User is authenticated and redirected to dashboard

**MFA Support**: If user has MFA enabled, step 7 redirects with `?mfaRequired=true&mfaToken=...` instead, and frontend shows MFA dialog (same as classic auth).

---

## 🧪 HOW TO TEST

### Prerequisites
1. ✅ Environment variables set (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
2. ✅ Google Cloud Console redirect URI configured
3. ✅ `spring.profiles.active=default,google` set
4. ✅ Backend running on `http://localhost:8082`
5. ✅ Frontend running on `http://localhost:8080`

### Test Steps

1. **Start Backend**:
   ```bash
   cd /Users/sanduta/Documents/VetSecure
   export GOOGLE_CLIENT_ID="your-id"
   export GOOGLE_CLIENT_SECRET="your-secret"
   export SPRING_PROFILES_ACTIVE=default,google
   ./mvnw spring-boot:run
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm start
   ```

3. **Open Browser**: `http://localhost:8080/login`

4. **Click "Sign in with Google"**:
   - Should redirect to Google consent screen
   - After approval, should redirect back to login page
   - Should automatically log you in and redirect to dashboard

5. **Verify Classic Auth Still Works**:
   - Use existing username/email + password
   - Should work exactly as before

---

## 🐛 COMMON FAILURE CAUSES

### 1. "redirect_uri_mismatch" Error
- **Cause**: Google Console redirect URI doesn't match backend URL
- **Fix**: Ensure Google Console has: `http://localhost:8082/login/oauth2/code/google`

### 2. "Invalid client" Error
- **Cause**: `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` not set or incorrect
- **Fix**: Verify environment variables are set and match Google Console

### 3. OAuth2 Button Doesn't Appear
- **Cause**: `google` profile not activated
- **Fix**: Set `SPRING_PROFILES_ACTIVE=default,google`

### 4. "oauth2_failed" Error on Frontend
- **Cause**: OAuth2 flow failed (user denied, network error, etc.)
- **Fix**: Check backend logs, verify Google Console settings

### 5. User Created But Not Logged In
- **Cause**: Frontend callback handler not reading `?token=...` from URL
- **Fix**: Verify `LoginPage.jsx` has the OAuth2 callback `useEffect` hook

### 6. CORS Errors
- **Cause**: Frontend origin not allowed in backend CORS config
- **Fix**: Verify `SecurityConfig.corsConfigurationSource()` includes `http://localhost:8080`

---

## 📝 NOTES

- **OAuth2 is ADDITIVE**: Classic username/password auth remains fully functional
- **No Frontend Tokens**: Frontend never receives Google tokens - only backend JWT
- **User Auto-Creation**: New Google users are automatically created with `PET_OWNER` role
- **Email Linking**: If a user with the same email exists, Google identity is linked (no duplicate users)
- **MFA Support**: OAuth2 users follow the same MFA flow as classic auth users
- **Session Management**: OAuth2 uses `IF_REQUIRED` sessions (for OAuth2 flow), API uses `STATELESS` (JWT)

---

## ✅ VERIFICATION CHECKLIST

- [ ] `GOOGLE_CLIENT_ID` environment variable set
- [ ] `GOOGLE_CLIENT_SECRET` environment variable set
- [ ] Google Cloud Console redirect URI: `http://localhost:8082/login/oauth2/code/google`
- [ ] `SPRING_PROFILES_ACTIVE=default,google` set
- [ ] Backend compiles: `./mvnw compile` succeeds
- [ ] Backend starts without errors
- [ ] Frontend shows "Sign in with Google" button
- [ ] Clicking button redirects to Google
- [ ] After Google approval, redirects back and logs in
- [ ] Classic username/password login still works

---

## 🎯 SUMMARY

**OAuth2 implementation is COMPLETE.** All code is in place. You only need to:
1. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables
2. Configure Google Cloud Console redirect URI: `http://localhost:8082/login/oauth2/code/google`
3. Activate `google` profile: `SPRING_PROFILES_ACTIVE=default,google`

Then restart the backend and test!

