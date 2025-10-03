import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Path aliases pour imports propres
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/config': path.resolve(__dirname, './src/config'),
      '@/middleware': path.resolve(__dirname, './src/middleware'),
      '@/utils': path.resolve(__dirname, './src/utils'),
    },
  },

  // Configuration du serveur de développement
  server: {
    port: 3000,
    host: true, // Écoute sur toutes les interfaces (pour Docker)
    strictPort: true, // Échec si port occupé
    open: false, // Ne pas ouvrir auto le navigateur

    // Security middleware
    middlewareMode: false,

    // Proxy pour contourner CORS avec l'API CityBikes
    proxy: {
      '/api/citybikes': {
        target: 'https://api.citybik.es',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/citybikes/, ''),
        secure: false,
      },
    },
  },

  // Configuration de build
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimisation des chunks
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },

  // Variables d'environnement exposées au client (préfixe VITE_)
  envPrefix: 'VITE_',

  // Configuration de test (Vitest)
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/types/',
        '**/*.d.ts',
      ],
    },
  },
})
