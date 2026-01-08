import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5273,
    open: true,
    host: '0.0.0.0'
  }
})
