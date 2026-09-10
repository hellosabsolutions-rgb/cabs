import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Safe production chunking:
 * NEVER put React in a separate chunk from libraries that call createContext
 * (@react-oauth/google, react-router, etc.) — that causes:
 *   TypeError: Cannot read properties of undefined (reading 'createContext')
 * after deploy when vendor-* loads before/without a resolved React instance.
 */
function manualChunks(id: string) {
  const normalized = id.replace(/\\/g, '/');
  if (!normalized.includes('node_modules')) return;

  // One React family chunk (core + router + Google OAuth)
  if (
    /\/(react|react-dom|scheduler)\//.test(normalized) ||
    normalized.includes('/react-router') ||
    normalized.includes('/@remix-run/') ||
    normalized.includes('/@react-oauth/')
  ) {
    return 'react-vendor';
  }

  // Heavy optional libs — safe to split
  if (normalized.includes('/firebase/') || normalized.includes('/@firebase/')) {
    return 'firebase';
  }
  if (normalized.includes('/leaflet/')) return 'maps';
  if (normalized.includes('socket.io') || normalized.includes('engine.io')) {
    return 'socket';
  }
  if (normalized.includes('/lucide-react/')) return 'icons';

  return 'vendor';
}

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  const env = loadEnv(mode, process.cwd(), '');
  const serverUrl = env.VITE_DEV_SERVER_URL || 'http://localhost:5000';

  return {
    plugins: [react()],

    resolve: {
      // Prevent duplicate React copies (createContext undefined)
      dedupe: ['react', 'react-dom'],
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@react-oauth/google'],
    },

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
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks,
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
      allowedHosts: [
        'admin.kabpro.pro',
        'admin-kabpro.opsiva.in',
        'localhost',
        '127.0.0.1'
      ],
    },
  };
});
