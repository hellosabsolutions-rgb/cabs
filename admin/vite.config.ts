import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  const env = loadEnv(mode, process.cwd(), '');
  const serverUrl = env.VITE_DEV_SERVER_URL || 'http://localhost:5000';

  return {
    plugins: [react()],

    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
      legalComments: 'none',
    },

    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProd,
      cssCodeSplit: true,
      cssMinify: isProd,
      minify: isProd ? 'esbuild' : false,
      reportCompressedSize: isProd,
      modulePreload: { polyfill: true },
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (id.includes('leaflet')) return 'maps';
            if (id.includes('socket.io-client') || id.includes('engine.io')) return 'socket';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('react-router') || id.includes('@remix-run/router')) return 'router';
            if (id.includes('react-dom') || id.includes('/react/')) return 'react';
            return 'vendor';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },

    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: serverUrl,
          changeOrigin: true,
        },
        '/socket.io': {
          target: serverUrl,
          ws: true,
          changeOrigin: true,
        },
      },
    },

    preview: {
      port: 3000,
      host: '127.0.0.1',
      allowedHosts: ['admin-kabpro.opsiva.in', 'localhost', '127.0.0.1'],
    },
  };
});
