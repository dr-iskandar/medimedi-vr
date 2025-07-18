# GLB Loading Issue Troubleshooting Guide

## Problem Description

Error: `JSON Parse error: Unrecognized token '<'` when loading `/kevin_kecil_v4.glb`

This error typically occurs when:
1. The GLB file is not properly served by the web server
2. The server returns an HTML error page instead of the binary GLB file
3. MIME type is not correctly configured for GLB files
4. The file is not copied to the build directory during the build process

## Quick Fix

Run the automated fix script:

```bash
# Make the script executable
chmod +x fix-glb-issue.sh

# Run the fix script
./fix-glb-issue.sh
```

## Manual Fix Steps

### 1. Update Vite Configuration

Ensure your `vite.config.js` includes proper GLB handling:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ensure GLB files are included as assets
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  // Configure public directory
  publicDir: 'public',
  // Configure build options
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep GLB files in root for easy access
          if (assetInfo.name && assetInfo.name.endsWith('.glb')) {
            return '[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },
  // Configure server for development
  server: {
    fs: {
      allow: ['..', './public']
    }
  }
})
```

### 2. Update Nginx Configuration

Add proper MIME types for GLB files in your Nginx configuration:

```nginx
server {
    listen 3000;
    server_name _;
    
    # Frontend static files
    location / {
        root /opt/medimedi-vr/medimedi-konvergen-vr/dist;
        try_files $uri $uri/ /index.html;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
    }
    
    # GLB files with proper MIME type
    location ~* \.glb$ {
        root /opt/medimedi-vr/medimedi-konvergen-vr/dist;
        add_header Content-Type "model/gltf-binary";
        add_header Access-Control-Allow-Origin "*";
        add_header Cache-Control "public, max-age=31536000";
        expires 1y;
    }
    
    # GLTF files
    location ~* \.gltf$ {
        root /opt/medimedi-vr/medimedi-konvergen-vr/dist;
        add_header Content-Type "model/gltf+json";
        add_header Access-Control-Allow-Origin "*";
        add_header Cache-Control "public, max-age=31536000";
        expires 1y;
    }
    
    # Other assets...
}
```

### 3. Rebuild the Application

```bash
# Navigate to frontend directory
cd /opt/medimedi-vr/medimedi-konvergen-vr

# Clean previous build
rm -rf dist

# Install dependencies
pnpm install

# Build for production
pnpm build

# Verify GLB file exists
ls -la dist/kevin_kecil_v4.glb
```

### 4. Restart Services

```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

## Verification Steps

### 1. Check File Existence

```bash
# Check if GLB file exists in public directory
ls -la /opt/medimedi-vr/medimedi-konvergen-vr/public/kevin_kecil_v4.glb

# Check if GLB file exists in dist directory
ls -la /opt/medimedi-vr/medimedi-konvergen-vr/dist/kevin_kecil_v4.glb
```

### 2. Test HTTP Response

```bash
# Test GLB file accessibility
curl -I http://localhost:3000/kevin_kecil_v4.glb

# Should return:
# HTTP/1.1 200 OK
# Content-Type: model/gltf-binary
# Access-Control-Allow-Origin: *
```

### 3. Check Browser Network Tab

1. Open browser developer tools (F12)
2. Go to Network tab
3. Reload the page
4. Look for the GLB file request
5. Check the response:
   - Status should be 200
   - Content-Type should be `model/gltf-binary`
   - Response should be binary data, not HTML

## Common Issues and Solutions

### Issue 1: GLB File Not Found in Dist

**Solution**: Manually copy the file
```bash
cp /opt/medimedi-vr/medimedi-konvergen-vr/public/kevin_kecil_v4.glb /opt/medimedi-vr/medimedi-konvergen-vr/dist/
```

### Issue 2: Wrong MIME Type

**Solution**: Add MIME type to Nginx main configuration
```bash
sudo nano /etc/nginx/mime.types
# Add this line:
model/gltf-binary glb;
```

### Issue 3: CORS Issues

**Solution**: Ensure CORS headers are properly set in Nginx configuration
```nginx
add_header Access-Control-Allow-Origin "*";
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
```

### Issue 4: Caching Issues

**Solution**: Clear browser cache and force reload
```bash
# Clear Nginx cache if using proxy_cache
sudo rm -rf /var/cache/nginx/*

# Restart Nginx
sudo systemctl restart nginx
```

## Development vs Production

### Development (Vite Dev Server)

In development, Vite serves files from the `public` directory directly:
- GLB files should be in `public/kevin_kecil_v4.glb`
- Accessible at `http://localhost:5173/kevin_kecil_v4.glb`

### Production (Nginx)

In production, Nginx serves files from the `dist` directory:
- GLB files should be in `dist/kevin_kecil_v4.glb`
- Accessible at `http://your-server:3000/kevin_kecil_v4.glb`

## Monitoring and Logs

### Check Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Check Browser Console

1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for any error messages related to GLB loading
4. Check for CORS errors or 404 errors

## Prevention

To prevent this issue in the future:

1. **Always test GLB loading** after deployment
2. **Use the automated fix script** when deploying
3. **Monitor Nginx logs** for 404 errors on GLB files
4. **Keep Vite configuration updated** for proper asset handling
5. **Test in both development and production** environments

## Support

If the issue persists after following this guide:

1. Check the browser network tab for the exact error
2. Verify file permissions on the GLB file
3. Test with a simple HTML file to ensure Nginx is working
4. Contact the development team with:
   - Browser console errors
   - Nginx error logs
   - Network tab screenshots
   - Server configuration details

---

**Last Updated**: $(date)
**Version**: 1.0
**Tested On**: Ubuntu 20.04/22.04, Nginx 1.18+, Node.js 18+