import fs from "fs"
import dotenv from "dotenv"
import * as path from "path"
import {defineConfig} from "vite"
import {VitePWA} from "vite-plugin-pwa"
import {favicons} from "favicons"
import htmlPlugin from "vite-plugin-html-config"
import sveltePreprocess from "svelte-preprocess"
import {svelte} from "@sveltejs/vite-plugin-svelte"
import {nodePolyfills} from "vite-plugin-node-polyfills"

dotenv.config({path: ".env.local"})
dotenv.config({path: ".env"})

const accentColor = process.env.VITE_LIGHT_THEME.match(/accent:(#\w+)/)[1]

export default defineConfig(async () => {
  const icons = await favicons("public" + process.env.VITE_APP_LOGO)

  if (!fs.existsSync("public/icons")) fs.mkdirSync("public/icons")

  for (const {name, contents} of icons.images) {
    fs.writeFileSync(`public/icons/${name}`, contents, "binary")
  }

  return {
    server: {
      https: false,
    },
    build: {
      sourcemap: true,
    },
    resolve: {
      alias: {
        src: path.resolve(__dirname, "src"),
      },
    },
    plugins: [
      nodePolyfills({
        protocolImports: true,
      }),
      htmlPlugin({
        title: process.env.VITE_APP_NAME,
        metas: [
          {name: "description", content: process.env.VITE_APP_DESCRIPTION},
          {name: "theme-color", content: accentColor},
          {name: "og:title", content: process.env.VITE_APP_NAME},
          {name: "og:type", content: "website"},
          {name: "og:description", content: process.env.VITE_APP_DESCRIPTION},
          {name: "og:image", content: "/images/banner.png"},
          {name: "twitter:card", content: "summary_large_image"},
          {name: "twitter:title", content: process.env.VITE_APP_NAME},
          {name: "twitter:description", content: process.env.VITE_APP_DESCRIPTION},
          {name: "twitter:image", content: "/images/banner.png"},
          {property: "og:url", content: process.env.VITE_APP_URL},
          {name: "msapplication-TileColor", content: accentColor},
          {name: "msapplication-TileImage", content: "/icons/mstile-144x144.png"},
        ],
        links: [
          {rel: "icon", href: "/icons/favicon.ico", sizes: "48x48"},
          {rel: "icon", href: "/icons/favicon-16x16.png", sizes: "any", type: "image/png"},
          {rel: "icon", href: "/icons/favicon-32x32.png", sizes: "any", type: "image/png"},
          {rel: "icon", href: "/icons/favicon-48x48.png", sizes: "any", type: "image/png"},
          {rel: "apple-touch-icon", sizes: "57x57", href: "/icons/apple-touch-icon-57x57.png"},
          {rel: "apple-touch-icon", sizes: "60x60", href: "/icons/apple-touch-icon-60x60.png"},
          {rel: "apple-touch-icon", sizes: "72x72", href: "/icons/apple-touch-icon-72x72.png"},
          {rel: "apple-touch-icon", sizes: "76x76", href: "/icons/apple-touch-icon-76x76.png"},
          {rel: "apple-touch-icon", sizes: "114x114", href: "/icons/apple-touch-icon-114x114.png"},
          {rel: "apple-touch-icon", sizes: "120x120", href: "/icons/apple-touch-icon-120x120.png"},
          {rel: "apple-touch-icon", sizes: "144x144", href: "/icons/apple-touch-icon-144x144.png"},
          {rel: "apple-touch-icon", sizes: "152x152", href: "/icons/apple-touch-icon-152x152.png"},
          {rel: "apple-touch-icon", sizes: "180x180", href: "/icons/apple-touch-icon-180x180.png"},
          {
            rel: "icon",
            type: "image/png",
            sizes: "192x192",
            href: "/icons/android-icon-192x192.png",
          },
          {rel: "icon", type: "image/png", sizes: "32x32", href: "/icons/favicon-32x32.png"},
          {rel: "icon", type: "image/png", sizes: "96x96", href: "/icons/favicon-96x96.png"},
          {rel: "icon", type: "image/png", sizes: "16x16", href: "/icons/favicon-16x16.png"},
          {rel: "mask-icon", href: "/images/logo.svg", color: "#FFFFFF"},

          {
            rel: "icon",
            type: "image/png",
            sizes: "144x144",
            href: "/icons/android-chrome-144x144.png",
          },
          {
            rel: "icon",
            type: "image/png",
            sizes: "192x192",
            href: "/icons/android-chrome-192x192.png",
          },
          {
            rel: "icon",
            type: "image/png",
            sizes: "256x256",
            href: "/icons/android-chrome-256x256.png",
          },
          {rel: "icon", type: "image/png", sizes: "36x36", href: "/icons/android-chrome-36x36.png"},
          {
            rel: "icon",
            type: "image/png",
            sizes: "384x384",
            href: "/icons/android-chrome-384x384.png",
          },
          {rel: "icon", type: "image/png", sizes: "48x48", href: "/icons/android-chrome-48x48.png"},
          {
            rel: "icon",
            type: "image/png",
            sizes: "512x512",
            href: "/icons/android-chrome-512x512.png",
          },
          {rel: "icon", type: "image/png", sizes: "72x72", href: "/icons/android-chrome-72x72.png"},
          {rel: "icon", type: "image/png", sizes: "96x96", href: "/icons/android-chrome-96x96.png"},
        ],
      }),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 ** 2, // 5 MB or set to something else
        },
        manifest: {
          name: process.env.VITE_APP_NAME,
          short_name: process.env.VITE_APP_NAME,
          description: process.env.VITE_APP_DESCRIPTION,
          theme_color: accentColor,
          protocol_handlers: [{protocol: "web+nostr", url: "/%s"}],
          permissions: ["clipboardRead", "clipboardWrite", "unlimitedStorage"],
          icons: [
            {src: "images/pwa-64x64.png", sizes: "64x64", type: "image/png"},
            {src: "images/pwa-192x192.png", sizes: "192x192", type: "image/png"},
            {src: "images/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any"},
            {
              src: "images/maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
      }),
      svelte({
        preprocess: sveltePreprocess(),
        onwarn: (warning, handler) => {
          if (warning.code.startsWith("a11y-")) return
          if (warning.filename.includes("node_modules")) return

          handler(warning)
        },
      }),
    ],
  }
})
