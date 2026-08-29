import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'reloop-local-demo-api',
      configureServer(server) {
        server.middlewares.use('/api/analyze-item', (_request, response) => {
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ demoModeRequired: true }))
        })
      },
    },
  ],
})
