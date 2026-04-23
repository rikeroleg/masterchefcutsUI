import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },

  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
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
          // 'vendor-stripe' is intentionally absent — CartPaymentModal and
          // PaymentModal are lazy-loaded, so Rollup auto-splits the Stripe
          // chunk and only fetches it when a payment modal is opened.
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-three':  ['three', '@react-three/fiber', '@react-three/drei', '@react-spring/three'],
          'vendor-map':    ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
})
