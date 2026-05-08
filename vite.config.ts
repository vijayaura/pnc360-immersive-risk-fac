import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
// import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.API_PROXY_TARGET;

  return {
    server: {
      host: '::',
      port: 8080,
      historyApiFallback: true,
      hmr: {
        overlay: false,
      },
      proxy: apiProxyTarget
        ? {
            '/api': {
              target: apiProxyTarget,
              changeOrigin: true,
              secure: true,
            },
          }
        : undefined,
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          cleanupOutdatedCaches: true,
        },
        devOptions: {
          enabled: false, // Disable in development
        },
      }),
      // Temporarily disabled due to NAPI compatibility issues
      // mode === 'development' &&
      // componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      force: true,
      include: ['react', 'react-dom', 'leaflet', 'react-leaflet'],
    },
    esbuild: {
      target: 'es2020',
    },
    build: {
      target: 'es2020',
    },
  };
});
