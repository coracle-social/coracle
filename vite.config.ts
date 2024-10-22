import fs from "fs"
import dotenv from "dotenv"
import * as path from "path"
import {defineConfig} from "vite"
import {VitePWA} from "vite-plugin-pwa"
import {favicons} from "favicons"
import htmlPlugin from "vite-plugin-html-config"
import {sveltekit} from "@sveltejs/kit/vite"
import svg from "@poppanator/sveltekit-svg"

dotenv.config({path: ".env.local"})
dotenv.config({path: ".env"})

const FAVICONS_DIR = "static/favicons"
const name = process.env.VITE_PLATFORM_NAME
const logo = process.env.VITE_PLATFORM_LOGO
const accent = process.env.VITE_PLATFORM_ACCENT
const description = process.env.VITE_PLATFORM_DESCRIPTION


export default defineConfig(async () => {
  const icons = await favicons(logo)

  if (!fs.existsSync(FAVICONS_DIR)) fs.mkdirSync(FAVICONS_DIR)

  for (const {name, contents} of icons.images) {
    fs.writeFileSync(`${FAVICONS_DIR}/${name}`, contents, "binary")
  }

  return {
    server: {
      port: 1847,
    },
    build: {
      sourcemap: true,
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
      htmlPlugin({
        title: name,
        metas: [
          {name: "description", content: description},
          {name: "theme-color", content: accent},
          {name: "og:title", content: name},
          {name: "og:type", content: "website"},
          {name: "og:description", content: description},
          {name: "og:image", content: "/banner.png"},
          {name: "twitter:card", content: "summary_large_image"},
          {name: "twitter:title", content: name},
          {name: "twitter:description", content: description},
          {name: "twitter:image", content: "/banner.png"},
          {property: "og:url", content: process.env.VITE_APP_URL},
          {name: "msapplication-TileColor", content: accent},
          {name: "msapplication-TileImage", content: "/favicons/mstile-144x144.png"},
        ],
        links: [
          {rel: "icon", href: "/favicons/favicon.ico", sizes: "48x48"},
          {rel: "icon", href: "/favicons/favicon-16x16.png", sizes: "any", type: "image/png"},
          {rel: "icon", href: "/favicons/favicon-32x32.png", sizes: "any", type: "image/png"},
          {rel: "icon", href: "/favicons/favicon-48x48.png", sizes: "any", type: "image/png"},
          {rel: "apple-touch-icon", sizes: "57x57", href: "/favicons/apple-touch-icon-57x57.png"},
          {rel: "apple-touch-icon", sizes: "60x60", href: "/favicons/apple-touch-icon-60x60.png"},
          {rel: "apple-touch-icon", sizes: "72x72", href: "/favicons/apple-touch-icon-72x72.png"},
          {rel: "apple-touch-icon", sizes: "76x76", href: "/favicons/apple-touch-icon-76x76.png"},
          {rel: "apple-touch-icon", sizes: "114x114", href: "/favicons/apple-touch-icon-114x114.png"},
          {rel: "apple-touch-icon", sizes: "120x120", href: "/favicons/apple-touch-icon-120x120.png"},
          {rel: "apple-touch-icon", sizes: "144x144", href: "/favicons/apple-touch-icon-144x144.png"},
          {rel: "apple-touch-icon", sizes: "152x152", href: "/favicons/apple-touch-icon-152x152.png"},
          {rel: "apple-touch-icon", sizes: "180x180", href: "/favicons/apple-touch-icon-180x180.png"},
          {
            rel: "icon",
            type: "image/png",
            sizes: "192x192",
            href: "/favicons/android-icon-192x192.png",
          },
          {rel: "icon", type: "image/png", sizes: "32x32", href: "/favicons/favicon-32x32.png"},
          {rel: "icon", type: "image/png", sizes: "96x96", href: "/favicons/favicon-96x96.png"},
          {rel: "icon", type: "image/png", sizes: "16x16", href: "/favicons/favicon-16x16.png"},
          {rel: "mask-icon", href: "/logo.svg", color: "#FFFFFF"},
          {
            rel: "icon",
            type: "image/png",
            sizes: "144x144",
            href: "/favicons/android-chrome-144x144.png",
          },
          {
            rel: "icon",
            type: "image/png",
            sizes: "192x192",
            href: "/favicons/android-chrome-192x192.png",
          },
          {
            rel: "icon",
            type: "image/png",
            sizes: "256x256",
            href: "/favicons/android-chrome-256x256.png",
          },
          {rel: "icon", type: "image/png", sizes: "36x36", href: "/favicons/android-chrome-36x36.png"},
          {
            rel: "icon",
            type: "image/png",
            sizes: "384x384",
            href: "/favicons/android-chrome-384x384.png",
          },
          {rel: "icon", type: "image/png", sizes: "48x48", href: "/favicons/android-chrome-48x48.png"},
          {
            rel: "icon",
            type: "image/png",
            sizes: "512x512",
            href: "/favicons/android-chrome-512x512.png",
          },
          {rel: "icon", type: "image/png", sizes: "72x72", href: "/favicons/android-chrome-72x72.png"},
          {rel: "icon", type: "image/png", sizes: "96x96", href: "/favicons/android-chrome-96x96.png"},
        ],
      }),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 ** 2, // 5 MB or set to something else
        },
        manifest: {
          name: name,
          short_name: name,
          description: description,
          theme_color: accent,
          protocol_handlers: [{protocol: "web+nostr", url: "/%s"}],
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
    ],
  }
})
