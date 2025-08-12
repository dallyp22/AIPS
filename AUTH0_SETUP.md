# 🔐 Auth0 Setup Guide for AIPS

## Step 1: Create Auth0 Account

1. Go to [Auth0.com](https://auth0.com) and sign up for a free account
2. Create a new tenant (e.g., "aips-production")

## Step 2: Create Application

1. In Auth0 Dashboard, go to **Applications** → **Create Application**
2. Choose **Single Page Application** 
3. Select **React** as the technology
4. Name it "AIPS Production Scheduler"

## Step 3: Configure Application Settings

### Application Settings
- **Name**: AIPS Production Scheduler
- **Application Type**: Single Page Application
- **Token Endpoint Authentication Method**: None

### Application URIs
```
Allowed Callback URLs:
http://localhost:5173, https://your-vercel-app.vercel.app

Allowed Logout URLs: 
http://localhost:5173, https://your-vercel-app.vercel.app

Allowed Web Origins:
http://localhost:5173, https://your-vercel-app.vercel.app
```

### Advanced Settings → Grant Types
- ✅ Authorization Code
- ✅ Refresh Token
- ✅ Implicit (for development only)

## Step 4: Create API

1. Go to **APIs** → **Create API**
2. **Name**: AIPS API
3. **Identifier**: `https://aips-api` (this is your audience)
4. **Signing Algorithm**: RS256

### API Settings
- **Allow Skipping User Consent**: ✅ (for development)
- **Allow Offline Access**: ✅

## Step 5: Set Up User Roles (Optional but Recommended)

1. Go to **User Management** → **Roles**
2. Create these roles:
   - **admin**: Full system access
   - **manager**: Can manage operators and schedules
   - **planner**: Can modify schedules
   - **operator**: View-only access

### Add Role Claims
1. Go to **Actions** → **Flows** → **Login**
2. Create a new action called "Add Roles to Token"
3. Use this code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://aips.app/';
  
  if (event.authorization) {
    // Add roles to token
    api.idToken.setCustomClaim(`${namespace}roles`, event.authorization.roles);
    api.accessToken.setCustomClaim(`${namespace}roles`, event.authorization.roles);
  }
};
```

## Step 6: Configure Environment Variables

### Frontend (.env.local)
```env
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-spa-client-id
VITE_AUTH0_AUDIENCE=https://aips-api
VITE_AUTH0_REDIRECT_URI=http://localhost:5173
```

### Backend (.env)
```env
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://aips-api
AUTH0_CLIENT_ID=your-spa-client-id
AUTH0_CLIENT_SECRET=your-client-secret
```

## Step 7: Test Users

1. Go to **User Management** → **Users** → **Create User**
2. Create test users:
   - **admin@aips.local** (assign admin role)
   - **manager@aips.local** (assign manager role)
   - **operator@aips.local** (assign operator role)

## Step 8: Assign Roles to Users

1. Go to each user's profile
2. Click **Roles** tab
3. Assign appropriate roles

## 🚀 Ready to Test!

1. Update your environment files with the actual Auth0 values
2. Restart both frontend and backend servers
3. Navigate to http://localhost:5173
4. You should see the login page
5. Sign in with one of your test users

## 🔧 Troubleshooting

### Common Issues:

**"Invalid Audience"**
- Check that `VITE_AUTH0_AUDIENCE` matches your API identifier exactly
- Ensure the API is enabled in Auth0

**"Invalid Callback URL"**
- Verify callback URLs are added to Auth0 application settings
- Check for trailing slashes (Auth0 is strict about exact matches)

**"CORS Error"**
- Make sure Web Origins are configured in Auth0
- Check that your backend CORS_ORIGIN includes your frontend URL

**"No Roles in Token"**
- Verify the Login Action is created and deployed
- Check that users have roles assigned
- Ensure the namespace URL is exactly `https://aips.app/`

## 🎯 Next Steps

After authentication is working:
1. Deploy to Railway (backend) and Vercel (frontend)
2. Update Auth0 URLs to include production domains
3. Configure production environment variables
4. Test end-to-end authentication flow

## 📚 Auth0 Documentation

- [React SDK Guide](https://auth0.com/docs/quickstart/spa/react)
- [API Authentication](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow)
- [Custom Claims](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)
