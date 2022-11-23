import * as path from 'path'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {find: 'src', replacement: path.resolve(__dirname, 'src')},
    ],
  },
  plugins: [svelte({
    onwarn: (warning, handler) => {
      if (warning.code.startsWith("a11y-")) return
      handler(warning)
    },
  })],
})
