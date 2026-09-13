import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const serverUrl = env.VITE_DEV_SERVER_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    server: {
      port: 3100,
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
      port: 3100,
      host: '127.0.0.1',
      allowedHosts: ['superadmin.kabpro.pro', 'localhost', '127.0.0.1'],
    },
    build: {
      target: 'es2020',
      outDir: 'dist',
      sourcemap: mode !== 'production',
    },
  };
});
