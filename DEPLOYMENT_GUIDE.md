# 🚀 AIPS Deployment Guide

This guide walks you through deploying AIPS to Railway (backend) and Vercel (frontend).

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **GitHub Repository**: Push your code to GitHub
4. **Auth0 Configuration**: Update callback URLs for production

---

## 🚂 Step 1: Deploy Backend to Railway

### 1.1 Create Railway Project
1. Go to [railway.app](https://railway.app) and click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your AIPS repository
4. Select **"Deploy Now"**

### 1.2 Add Database
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will create a PostgreSQL database and provide connection details

### 1.3 Configure Environment Variables
In Railway, go to your backend service → **"Variables"** tab and add:

```bash
# Database (automatically provided by Railway)
DATABASE_URL=postgresql://postgres:FyakUKmJeNIqcWADBcAdWkWwNDvNnQVg@postgres.railway.internal:5432/railway

# Auth0 Configuration
AUTH0_DOMAIN=dev-nb6hi0n2pk2u0vtw.us.auth0.com
AUTH0_AUDIENCE=https://aips-api
AUTH0_CLIENT_ID=xnNBOEJHfvCAcbr7d7AfkXxDO6msUmT1
AUTH0_CLIENT_SECRET=X1GQ3Ykqy45CPbTmSMi539nD6dHmyTtXrwFt8Qw6yEKNzFVd0rg6-CEla2HrxuSq

# CORS (update after Vercel deployment)
CORS_ORIGIN=https://your-app.vercel.app

# Runtime
NODE_ENV=production
PORT=3000
```

### 1.4 Run Database Migration
1. In Railway, go to your backend service
2. Click **"Deployments"** → **"View Logs"**
3. Once deployed, run: `prisma migrate deploy` (Railway will handle this via the deploy script)

### 1.5 Get Backend URL
- Copy your Railway backend URL (e.g., `https://your-project.railway.app`)
- You'll need this for the frontend configuration

---

## ⚡ Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Project
1. Go to [vercel.com](https://vercel.com) and click **"New Project"**
2. Import your GitHub repository
3. Set **Root Directory** to: `AIPS_Cursor_Prod_Starter_UI_v1/frontend`
4. **Framework Preset**: Vite
5. Click **"Deploy"**

### 2.2 Configure Environment Variables
In Vercel, go to your project → **"Settings"** → **"Environment Variables"** and add:

```bash
VITE_API_URL=https://your-railway-app.railway.app
VITE_AUTH0_DOMAIN=dev-nb6hi0n2pk2u0vtw.us.auth0.com
VITE_AUTH0_CLIENT_ID=xnNBOEJHfvCAcbr7d7AfkXxDO6msUmT1
VITE_AUTH0_AUDIENCE=https://aips-api
VITE_AUTH0_REDIRECT_URI=https://your-app.vercel.app
```

### 2.3 Update Backend CORS
1. Go back to Railway
2. Update the `CORS_ORIGIN` variable with your Vercel URL
3. Redeploy the backend

---

## 🔐 Step 3: Update Auth0 Configuration

### 3.1 Add Production URLs
In your Auth0 Dashboard:

1. **Applications** → **Your App** → **Settings**
2. **Allowed Callback URLs**: Add your Vercel URL
   ```
   http://localhost:5173, https://your-app.vercel.app
   ```
3. **Allowed Logout URLs**: Add your Vercel URL
   ```
   http://localhost:5173, https://your-app.vercel.app
   ```
4. **Allowed Web Origins**: Add your Vercel URL
   ```
   http://localhost:5173, https://your-app.vercel.app
   ```

### 3.2 Update API Settings
1. **APIs** → **AIPS API** → **Settings**
2. Verify **Identifier**: `https://aips-api`

---

## 🧪 Step 4: Test Deployment

### 4.1 Backend Health Check
Visit: `https://your-railway-app.railway.app/health`

Expected response:
```json
{"status":"healthy","timestamp":"2024-xx-xx"}
```

### 4.2 Frontend Access
1. Visit: `https://your-app.vercel.app`
2. Click **"Sign In to AIPS"**
3. Complete Auth0 login flow
4. Verify you can access the application

### 4.3 End-to-End Test
- ✅ Login/logout works
- ✅ API calls succeed (check Network tab)
- ✅ Data loads correctly
- ✅ All pages accessible

---

## 🔧 Step 5: Production Optimization

### 5.1 Enable Error Monitoring
Consider adding:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Railway Observability** for backend monitoring

### 5.2 Performance Monitoring
- Enable Vercel Analytics
- Set up Railway metrics
- Monitor database performance

### 5.3 Security Checklist
- ✅ HTTPS enforced
- ✅ CORS properly configured
- ✅ Auth0 production settings
- ✅ Environment variables secured
- ✅ Database credentials rotated

---

## 🆘 Troubleshooting

### Common Issues

**1. CORS Errors**
- Verify `CORS_ORIGIN` in Railway matches your Vercel URL exactly
- Check Auth0 allowed origins

**2. Database Connection Failed**
- Verify `DATABASE_URL` in Railway
- Ensure migrations ran successfully
- Check Railway database logs

**3. Auth0 Login Failed**
- Verify all Auth0 URLs include production domains
- Check `AUTH0_DOMAIN` and `AUTH0_CLIENT_ID` match
- Verify `AUTH0_AUDIENCE` is correct

**4. 401 Unauthorized**
- Check `AUTH0_CLIENT_SECRET` in Railway
- Verify JWT configuration
- Check backend logs for auth errors

### Useful Commands

```bash
# Check Railway logs
railway logs

# Check Vercel deployment logs
vercel logs

# Test API endpoint
curl https://your-railway-app.railway.app/health

# Test database connection
railway shell
```

---

## 🎉 Success!

Your AIPS application is now deployed and ready for production use with:

- ✅ **Multi-tenant ready** database schema
- ✅ **Secure authentication** via Auth0
- ✅ **Scalable infrastructure** on Railway + Vercel
- ✅ **Production monitoring** and error handling

**Next Steps:**
1. Set up monitoring and alerts
2. Configure backup strategies
3. Plan multi-tenancy rollout
4. Add custom domain (optional)

---

*Need help? Check the logs in Railway/Vercel or review the Auth0 documentation.*
