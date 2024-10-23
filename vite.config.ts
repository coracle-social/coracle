import fs from "fs"
import dotenv from "dotenv"
import * as path from "path"
import {defineConfig} from "vite"
import {SvelteKitPWA} from '@vite-pwa/sveltekit'
import {sveltekit} from "@sveltejs/kit/vite"
import svg from "@poppanator/sveltekit-svg"

dotenv.config({path: ".env.local"})
dotenv.config({path: ".env"})

const FAVICONS_DIR = "static/favicons"
const name = process.env.VITE_PLATFORM_NAME
const accent = process.env.VITE_PLATFORM_ACCENT
const description = process.env.VITE_PLATFORM_DESCRIPTION

export default defineConfig({
  server: {
    port: 1847,
  },
  build: {
    sourcemap: true,
  },
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 ** 2, // 5 MB or set to something else
      },
      manifest: {
        name: name,
        short_name: name,
        theme_color: accent,
        description: description,
        permissions: ["clipboardRead", "clipboardWrite", "unlimitedStorage"],
        icons: [
          {src: "pwa-64x64.png", sizes: "64x64", type: "image/png"},
          {src: "pwa-192x192.png", sizes: "192x192", type: "image/png"},
          {src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any"},
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
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
