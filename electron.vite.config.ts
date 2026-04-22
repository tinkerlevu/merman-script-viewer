import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import prismjs from 'vite-plugin-prismjs';

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      react(),
      prismjs({
        languages: ['javascript'],
      }),
    ],

    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/renderer/index.html'),
          admin: resolve(__dirname, 'src/renderer/mermaid_render_index.html'),
        },
      },
    },
  },

})
