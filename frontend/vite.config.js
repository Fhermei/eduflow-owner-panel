// // owner_panel/frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 5174,
//     host: true,  // ← ADD THIS - allows access from network
//     open: true,  // ← ADD THIS - automatically opens browser
//     proxy: {
//       '/api': {
//         target: 'http://localhost:8005',
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/api/, '/api')
//       }
//     }
//   }
// })


export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8005',  
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers['authorization']) {
              proxyReq.setHeader('authorization', req.headers['authorization']);
            }
          });
        },
      }
    }
  }
})