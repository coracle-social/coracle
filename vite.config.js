import * as path from 'path'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import sveltePreprocess from 'svelte-preprocess'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  server: {
    https: false,
  },
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src'),
    }
  },
  plugins: [
    mkcert(),
    nodePolyfills({
      protocolImports: true,
    }),
    svelte({
      preprocess: sveltePreprocess(),
      onwarn: (warning, handler) => {

        if (warning.code.startsWith('a11y-')) return
        if (warning.filename.includes("node_modules")) return

        handler(warning)
      },
    }),
  ],
})
