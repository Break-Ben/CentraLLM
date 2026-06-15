import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@main': resolve(__dirname, 'src/main'),
        '@shared': resolve(__dirname, 'src/shared'),
        '@preload': resolve(__dirname, 'src/preload'),
        '@resources': resolve(__dirname, 'resources')
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared'),
        '@preload': resolve(__dirname, 'src/preload')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer/src'),
        '@shared': resolve(__dirname, 'src/shared'),
        '@preload': resolve(__dirname, 'src/preload'),
        '@resources': resolve(__dirname, 'resources')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
