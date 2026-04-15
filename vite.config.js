import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-three':  ['three', '@react-three/fiber', '@react-three/drei', '@react-spring/three'],
          'vendor-stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'vendor-map':    ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
})
