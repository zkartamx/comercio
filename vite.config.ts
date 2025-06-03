import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        proxy: {
          '/api': {
            target: 'http://localhost:4000', // Ensure this is your backend port
            changeOrigin: true,
            // secure: false, // Uncomment if backend is https with self-signed cert
            // rewrite: (path) => path.replace(/^\/api/, '') // Uncomment if backend routes don't include /api
          }
        }
      }
    };
});
