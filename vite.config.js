import * as path from 'path'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    global: {},
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src'),
    }
  },
  plugins: [
    nodePolyfills({
      protocolImports: true,
    }),
    svelte({
      onwarn: (warning, handler) => {
        if (warning.code.startsWith("a11y-")) return
        handler(warning)
      },
    }),
  ],
})
