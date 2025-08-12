# 🚀 AIPS Deployment Stabilization Checklist

## ✅ **Critical Issues Fixed**

### **1. Schema-Environment Alignment**
- ✅ **PostgreSQL schema** matches Railway database
- ✅ **Dockerfile** updated for PostgreSQL (removed SQLite)
- ✅ **Railway config** uses Nixpacks (simpler than custom Dockerfile)
- ✅ **Environment variables** properly configured

### **2. Build Process Stabilized**
- ✅ **Monorepo structure** correctly handled
- ✅ **Prisma generation** runs after install
- ✅ **TypeScript compilation** includes all imports
- ✅ **Database schema push** on startup

### **3. Required Railway Environment Variables**
```bash
# Database (Provided by Railway PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:port/db

# Auth0 (Must match your actual Auth0 app)
AUTH0_DOMAIN=dev-nb6hi0n2pk2u0vtw.us.auth0.com
AUTH0_AUDIENCE=https://aips-api
AUTH0_CLIENT_ID=xnNBOEJHfvCAcbr7d7AfkXxDO6msUmT1
AUTH0_CLIENT_SECRET=[your-actual-secret]

# CORS (Must match your Vercel URL)
CORS_ORIGIN=https://aips-frontend.vercel.app

# Runtime
NODE_ENV=production
```

### **4. Required Vercel Environment Variables**
```bash
# API Connection
VITE_API_URL=https://aips-production.up.railway.app

# Auth0 (Must match Railway backend)
VITE_AUTH0_DOMAIN=dev-nb6hi0n2pk2u0vtw.us.auth0.com
VITE_AUTH0_CLIENT_ID=xnNBOEJHfvCAcbr7d7AfkXxDO6msUmT1
VITE_AUTH0_AUDIENCE=https://aips-api
VITE_AUTH0_REDIRECT_URI=https://aips-frontend.vercel.app
```

## 🔧 **Deployment Steps (In Order)**

### **Step 1: Railway Backend**
1. ✅ **Update environment variables** (see above)
2. ✅ **Ensure PostgreSQL database** is connected
3. ✅ **Deploy backend** (will auto-deploy from GitHub push)
4. ✅ **Verify health endpoint**: `/health`

### **Step 2: Vercel Frontend**  
1. ✅ **Update environment variables** (see above)
2. ✅ **Deploy frontend** (will auto-deploy from GitHub push)
3. ✅ **Test login flow**

### **Step 3: Auth0 Configuration**
1. ✅ **Update Allowed Callback URLs**: 
   - `https://aips-frontend.vercel.app`
2. ✅ **Update Allowed Logout URLs**:
   - `https://aips-frontend.vercel.app`  
3. ✅ **Update Allowed Web Origins**:
   - `https://aips-frontend.vercel.app`

### **Step 4: Test Data Import**
1. ✅ **Login to AIPS frontend**
2. ✅ **Go to Settings → Data Import tab**
3. ✅ **Click "Import Production Data"**
4. ✅ **Verify data loads across all pages**

## 🧪 **Verification Tests**

### **Backend Health Checks**
- [ ] `GET /health` returns `{"ok":true,"ts":...}`
- [ ] `GET /auth/status` returns Auth0 config
- [ ] `GET /plants` returns `[]` (empty before import)
- [ ] `GET /orders` returns `[]` (empty before import)

### **Frontend Authentication**
- [ ] Login button appears
- [ ] Auth0 login flow works  
- [ ] Dashboard loads after login
- [ ] Settings page accessible

### **Data Import Flow**
- [ ] Settings → Data Import tab loads
- [ ] Import button works without errors
- [ ] Success message appears
- [ ] All pages show imported data

### **End-to-End Functionality**
- [ ] Schedule Board shows schedule blocks
- [ ] Orders page shows 10+ orders
- [ ] Resources page shows operators
- [ ] All navigation works

## 🚨 **Common Failure Points & Solutions**

### **1. Railway Build Fails**
**Cause**: Environment/schema mismatch
**Fix**: Verify `DATABASE_URL` points to PostgreSQL, not SQLite

### **2. "Table does not exist" Errors**
**Cause**: Database schema not created
**Fix**: `prisma db push` runs in startup command

### **3. CORS Errors on Frontend**
**Cause**: `CORS_ORIGIN` mismatch
**Fix**: Ensure Railway `CORS_ORIGIN` exactly matches Vercel URL

### **4. Auth0 Login Fails**
**Cause**: Callback URL mismatch
**Fix**: Update Auth0 Allowed URLs with production domains

### **5. Import Button Fails**
**Cause**: Database connection or schema issues
**Fix**: Check Railway logs for Prisma errors

## 📊 **Success Criteria**

### **✅ Stable Deployment Achieved When:**
1. **Railway backend** starts without errors
2. **Vercel frontend** loads and login works
3. **Data import** completes successfully
4. **All AIPS features** functional with real data
5. **No 401/403/500 errors** in browser console

---

## 🎯 **Key Differences from Previous Attempts**

1. **Consistent Environment**: PostgreSQL everywhere (no SQLite conflicts)
2. **Simplified Build**: Nixpacks instead of custom Dockerfile
3. **Proper Variable Management**: All env vars documented and verified
4. **UI-Based Import**: No external database tools needed
5. **Comprehensive Testing**: Clear verification steps

**This approach eliminates the configuration drift that caused previous failures.**
