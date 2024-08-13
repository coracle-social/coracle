import {sveltekit} from "@sveltejs/kit/vite"
import svg from "@poppanator/sveltekit-svg"
import {defineConfig} from "vite"

export default defineConfig({
  server: {
    port: 1847,
  },
  plugins: [
    sveltekit(),
    svg({
      svgoOptions: {
        multipass: true,
        plugins: [
          {
            name: "preset-default",
            params: {
              overrides: {
                removeViewBox: false,
              },
            },
          },
          "removeDimensions",
        ],
      },
    }),
  ],
})
