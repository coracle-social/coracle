import * as path from 'path'
import { defineConfig } from 'vite'
import sveltePreprocess from 'svelte-preprocess'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  build: {
    sourcemap: true,
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
      preprocess: sveltePreprocess(),
      onwarn: (warning, handler) => {

        if (warning.code.startsWith('a11y-')) return
        if (warning.filename.includes("node_modules")) return

        handler(warning)
      },
    }),
  ],
})
