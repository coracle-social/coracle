import * as path from "path"
import {sveltekit} from '@sveltejs/kit/vite'
import svg from '@poppanator/sveltekit-svg'
import {defineConfig} from 'vite'

export default defineConfig({
	plugins: [
  	sveltekit(),
  	svg({
      svgoOptions: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                removeViewBox: false,
              },
            },
          },
          "removeDimensions",
        ],
      },
    })
	],
  resolve: {
    alias: {
      'src': path.resolve(__dirname, "src"),
      'app': path.resolve(__dirname, "src/app"),
      'lib': path.resolve(__dirname, "src/lib"),
      'assets': path.resolve(__dirname, "src/assets"),
    },
  },
});
