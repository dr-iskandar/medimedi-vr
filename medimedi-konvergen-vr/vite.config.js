import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
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
