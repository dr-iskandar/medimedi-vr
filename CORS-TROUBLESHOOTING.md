# 🔧 CORS Troubleshooting Guide

## 🚨 Problem Description

The application was experiencing CORS (Cross-Origin Resource Sharing) errors when trying to access the backend API:

```
[Error] Not allowed to request resource
[Error] Fetch API cannot load http://localhost:5001/api/emotion/test due to access control checks.
```

## 🔍 Root Cause

The frontend code had **hardcoded localhost URLs** instead of using environment variables, causing the application to try accessing `localhost:5001` even in production where the backend is available at `156.67.217.39:5001`.

### Files with Hardcoded URLs:
- `src/App.jsx` - Backend connection test
- `src/components/DebugPanel.jsx` - Debug panel API calls
- `elevenlabs-conversational-ai/src/components/ConversationInterface.jsx` - Emotion analysis API

## ⚡ Quick Fix

Run the automated fix script:

```bash
# From project root directory
./fix-cors-issue.sh
```

## 🛠️ Manual Fix Steps

### 1. Update Frontend Code

**App.jsx** - Replace hardcoded URL:
```javascript
// Before (❌ Wrong)
const response = await fetch('http://localhost:5001/api/emotion/test');

// After (✅ Correct)
const backendUrl = import.meta.env.VITE_BACKEND_DIRECT_URL || 'http://localhost:5001';
const response = await fetch(`${backendUrl}/api/emotion/test`);
```

**DebugPanel.jsx** - Update test functions:
```javascript
// Before (❌ Wrong)
const response = await fetch('http://localhost:5001/api/emotion/test');

// After (✅ Correct)
const backendUrl = import.meta.env.VITE_BACKEND_DIRECT_URL || 'http://localhost:5001';
const response = await fetch(`${backendUrl}/api/emotion/test`);
```

**ConversationInterface.jsx** - Fix emotion analysis:
```javascript
// Before (❌ Wrong)
let apiUrl = 'http://localhost:5000/api/emotion/analyze';

// After (✅ Correct)
const backendUrl = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5001' : '');
const apiUrl = backendUrl ? `${backendUrl}/emotion/analyze` : '/api/emotion/analyze';
```

### 2. Verify Environment Variables

Check `.env.production` contains:
```bash
VITE_BACKEND_URL=http://156.67.217.39:5211/api
VITE_BACKEND_DIRECT_URL=http://156.67.217.39:5001
VITE_SERVER_IP=156.67.217.39
VITE_SERVER_PORT=5211
VITE_BACKEND_PORT=5001
```

### 3. Rebuild Frontend

```bash
cd medimedi-konvergen-vr

# Clean previous build
rm -rf dist

# Build with environment variables
VITE_BACKEND_URL=http://156.67.217.39:5211/api VITE_BACKEND_DIRECT_URL=http://156.67.217.39:5001 pnpm build
```

### 4. Deploy to Server

```bash
# Copy dist folder to server
scp -r dist/* user@156.67.217.39:/var/www/medimedi-vr/medimedi-konvergen-vr/dist/

# Restart Nginx
sudo systemctl restart nginx
```

## 🔍 Verification Steps

### 1. Check Browser Network Tab
- Open Developer Tools → Network tab
- Look for API calls to `156.67.217.39:5211/api` (not localhost)
- Verify no CORS errors in console

### 2. Test Backend Connection
- Click "Test Backend" button in Debug Panel
- Should show success message
- Check console for successful API response

### 3. Test Emotion Analysis
- Use Debug Panel emotion test buttons
- Verify emotion detection works
- Check API calls go to correct URLs

## 🚨 Common Issues

### Issue 1: Still Getting localhost Errors
**Solution**: Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue 2: Environment Variables Not Loading
**Solution**: Ensure `.env.production` is in the correct location and rebuild

### Issue 3: Backend Not Responding
**Solution**: Check if backend service is running:
```bash
pm2 status
curl http://156.67.217.39:5001/api/emotion/test
```

### Issue 4: Nginx Configuration
**Solution**: Verify Nginx CORS headers:
```nginx
# In /etc/nginx/sites-available/medimedi-vr
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
```

## 🌐 Environment Differences

### Development (localhost)
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`
- Uses fallback localhost URLs

### Production (server)
- Frontend: `http://156.67.217.39:5211`
- Backend API: `http://156.67.217.39:5211/api` (proxied)
- Direct Backend: `http://156.67.217.39:5001`
- Uses environment variables

## 📊 Monitoring

### Check Logs
```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Backend logs
pm2 logs medimedi-backend

# Browser console
# Look for network errors and CORS messages
```

### Health Checks
```bash
# Backend health
curl http://156.67.217.39:5001/api/emotion/test

# Frontend access
curl http://156.67.217.39:5211

# API through proxy
curl http://156.67.217.39:5211/api/emotion/test
```

## 🛡️ Prevention

1. **Always use environment variables** for API URLs
2. **Never hardcode localhost** in production code
3. **Test in production-like environment** before deployment
4. **Use relative URLs** when possible for same-origin requests
5. **Implement proper CORS headers** on backend

## 📞 Support

If issues persist:

1. Check all environment variables are set correctly
2. Verify Nginx configuration includes CORS headers
3. Ensure backend service is running and accessible
4. Clear browser cache and test in incognito mode
5. Check network connectivity between frontend and backend

---

**Last Updated**: $(date)
**Status**: ✅ CORS issues resolved
**Next Review**: After next deployment