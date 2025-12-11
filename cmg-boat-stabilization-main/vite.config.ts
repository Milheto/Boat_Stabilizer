import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['mqtt'],
    esbuildOptions: {
      // Ensure mqtt is treated as external or bundled correctly
      target: 'es2020',
    },
  },
})

