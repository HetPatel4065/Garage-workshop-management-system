import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'prevent-full-reload',
      transformIndexHtml(html) {
        return html.replace(
          '</head>',
          `<script type="module">
            if (import.meta.hot) {
              import.meta.hot.on('vite:beforeFullReload', () => {
                console.log('[Vite HMR] Full reload prevented to keep page state.');
                throw new Error('Preventing full page reload on HMR.');
              });
            }
          </script></head>`
        );
      }
    }
  ],
  server: {
    watch: {
      usePolling: true,
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        // target: "http://192.168.1.:5000",
        changeOrigin: true,
      },
    },
  },
});