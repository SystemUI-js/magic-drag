import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5273,
    open: true,
    host: '0.0.0.0'
  },
  resolve: {
    alias: {
      '@system-ui-js/multi-drag': '@system-ui-js/multi-drag/dist/index.esm.js'
    }
  },
  optimizeDeps: {
    include: ['@system-ui-js/multi-drag']
  }
})
