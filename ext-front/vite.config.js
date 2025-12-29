import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // This tells Vite that sidepanel.html is your entry point
        sidepanel: resolve(__dirname, 'sidepanel.html'),
      },
    },
    outDir: 'dist',
  },
})