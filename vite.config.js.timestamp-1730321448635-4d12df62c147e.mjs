// vite.config.js
import fs from "fs";
import dotenv from "file:///Users/jstaab/my/nostr/coracle/node_modules/dotenv/lib/main.js";
import * as path from "path";
import { defineConfig } from "file:///Users/jstaab/my/nostr/coracle/node_modules/vite/dist/node/index.js";
import { VitePWA } from "file:///Users/jstaab/my/nostr/coracle/node_modules/vite-plugin-pwa/dist/index.js";
import { favicons } from "file:///Users/jstaab/my/nostr/coracle/node_modules/favicons/dist/index.mjs";
import htmlPlugin from "file:///Users/jstaab/my/nostr/coracle/node_modules/vite-plugin-html-config/dist/index.js";
import sveltePreprocess from "file:///Users/jstaab/my/nostr/coracle/node_modules/svelte-preprocess/dist/index.js";
import { svelte } from "file:///Users/jstaab/my/nostr/coracle/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import { nodePolyfills } from "file:///Users/jstaab/my/nostr/coracle/node_modules/vite-plugin-node-polyfills/dist/index.js";
var __vite_injected_original_dirname = "/Users/jstaab/my/nostr/coracle";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
var accentColor = process.env.VITE_LIGHT_THEME.match(/accent:(#\w+)/)[1];
var vite_config_default = defineConfig(async () => {
  const icons = await favicons("public" + process.env.VITE_APP_LOGO);
  if (!fs.existsSync("public/icons")) fs.mkdirSync("public/icons");
  for (const { name, contents } of icons.images) {
    fs.writeFileSync(`public/icons/${name}`, contents, "binary");
  }
  return {
    server: {
      https: false
    },
    build: {
      sourcemap: true
    },
    resolve: {
      alias: {
        src: path.resolve(__vite_injected_original_dirname, "src")
      }
    },
    plugins: [
      nodePolyfills({
        protocolImports: true
      }),
      htmlPlugin({
        title: process.env.VITE_APP_NAME,
        metas: [
          { name: "description", content: process.env.VITE_APP_DESCRIPTION },
          { name: "theme-color", content: accentColor },
          { name: "og:title", content: process.env.VITE_APP_NAME },
          { name: "og:type", content: "website" },
          { name: "og:description", content: process.env.VITE_APP_DESCRIPTION },
          { name: "og:image", content: "/images/banner.png" },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:title", content: process.env.VITE_APP_NAME },
          { name: "twitter:description", content: process.env.VITE_APP_DESCRIPTION },
          { name: "twitter:image", content: "/images/banner.png" },
          { property: "og:url", content: process.env.VITE_APP_URL },
          { name: "msapplication-TileColor", content: accentColor },
          { name: "msapplication-TileImage", content: "/icons/mstile-144x144.png" }
        ],
        links: [
          { rel: "icon", href: "/icons/favicon.ico", sizes: "48x48" },
          { rel: "icon", href: "/icons/favicon-16x16.png", sizes: "any", type: "image/png" },
          { rel: "icon", href: "/icons/favicon-32x32.png", sizes: "any", type: "image/png" },
          { rel: "icon", href: "/icons/favicon-48x48.png", sizes: "any", type: "image/png" },
          { rel: "apple-touch-icon", sizes: "57x57", href: "/icons/apple-touch-icon-57x57.png" },
          { rel: "apple-touch-icon", sizes: "60x60", href: "/icons/apple-touch-icon-60x60.png" },
          { rel: "apple-touch-icon", sizes: "72x72", href: "/icons/apple-touch-icon-72x72.png" },
          { rel: "apple-touch-icon", sizes: "76x76", href: "/icons/apple-touch-icon-76x76.png" },
          { rel: "apple-touch-icon", sizes: "114x114", href: "/icons/apple-touch-icon-114x114.png" },
          { rel: "apple-touch-icon", sizes: "120x120", href: "/icons/apple-touch-icon-120x120.png" },
          { rel: "apple-touch-icon", sizes: "144x144", href: "/icons/apple-touch-icon-144x144.png" },
          { rel: "apple-touch-icon", sizes: "152x152", href: "/icons/apple-touch-icon-152x152.png" },
          { rel: "apple-touch-icon", sizes: "180x180", href: "/icons/apple-touch-icon-180x180.png" },
          {
            rel: "icon",
            type: "image/png",
            sizes: "192x192",
            href: "/icons/android-icon-192x192.png"
          },
          { rel: "icon", type: "image/png", sizes: "32x32", href: "/icons/favicon-32x32.png" },
          { rel: "icon", type: "image/png", sizes: "96x96", href: "/icons/favicon-96x96.png" },
          { rel: "icon", type: "image/png", sizes: "16x16", href: "/icons/favicon-16x16.png" },
          { rel: "mask-icon", href: "/images/logo.svg", color: "#FFFFFF" },
          {
            rel: "icon",
            type: "image/png",
            sizes: "144x144",
            href: "/icons/android-chrome-144x144.png"
          },
          {
            rel: "icon",
            type: "image/png",
            sizes: "192x192",
            href: "/icons/android-chrome-192x192.png"
          },
          {
            rel: "icon",
            type: "image/png",
            sizes: "256x256",
            href: "/icons/android-chrome-256x256.png"
          },
          { rel: "icon", type: "image/png", sizes: "36x36", href: "/icons/android-chrome-36x36.png" },
          {
            rel: "icon",
            type: "image/png",
            sizes: "384x384",
            href: "/icons/android-chrome-384x384.png"
          },
          { rel: "icon", type: "image/png", sizes: "48x48", href: "/icons/android-chrome-48x48.png" },
          {
            rel: "icon",
            type: "image/png",
            sizes: "512x512",
            href: "/icons/android-chrome-512x512.png"
          },
          { rel: "icon", type: "image/png", sizes: "72x72", href: "/icons/android-chrome-72x72.png" },
          { rel: "icon", type: "image/png", sizes: "96x96", href: "/icons/android-chrome-96x96.png" },
          { rel: "apple-touch-icon", sizes: "1024x1024", href: "apple-touch-icon-1024x1024.png" },
          { rel: "apple-touch-icon", sizes: "114x114", href: "apple-touch-icon-114x114.png" },
          { rel: "apple-touch-icon", sizes: "120x120", href: "apple-touch-icon-120x120.png" },
          { rel: "apple-touch-icon", sizes: "144x144", href: "apple-touch-icon-144x144.png" },
          { rel: "apple-touch-icon", sizes: "152x152", href: "apple-touch-icon-152x152.png" },
          { rel: "apple-touch-icon", sizes: "167x167", href: "apple-touch-icon-167x167.png" },
          { rel: "apple-touch-icon", sizes: "180x180", href: "apple-touch-icon-180x180.png" },
          { rel: "apple-touch-icon", sizes: "57x57", href: "apple-touch-icon-57x57.png" },
          { rel: "apple-touch-icon", sizes: "60x60", href: "apple-touch-icon-60x60.png" },
          { rel: "apple-touch-icon", sizes: "72x72", href: "apple-touch-icon-72x72.png" },
          { rel: "apple-touch-icon", sizes: "76x76", href: "apple-touch-icon-76x76.png" }
        ]
      }),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 ** 2
          // 5 MB or set to something else
        },
        manifest: {
          name: process.env.VITE_APP_NAME,
          short_name: process.env.VITE_APP_NAME,
          description: process.env.VITE_APP_DESCRIPTION,
          theme_color: accentColor,
          protocol_handlers: [{ protocol: "web+nostr", url: "/%s" }],
          permissions: ["clipboardRead", "clipboardWrite", "unlimitedStorage"],
          icons: [
            { src: "images/pwa-64x64.png", sizes: "64x64", type: "image/png" },
            { src: "images/pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "images/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            {
              src: "images/maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ]
        }
      }),
      svelte({
        preprocess: sveltePreprocess(),
        onwarn: (warning, handler) => {
          if (warning.code.startsWith("a11y-")) return;
          if (warning.filename.includes("node_modules")) return;
          handler(warning);
        }
      })
    ]
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvanN0YWFiL215L25vc3RyL2NvcmFjbGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9qc3RhYWIvbXkvbm9zdHIvY29yYWNsZS92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvanN0YWFiL215L25vc3RyL2NvcmFjbGUvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgZnMgZnJvbSBcImZzXCJcbmltcG9ydCBkb3RlbnYgZnJvbSBcImRvdGVudlwiXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCJcbmltcG9ydCB7ZGVmaW5lQ29uZmlnfSBmcm9tIFwidml0ZVwiXG5pbXBvcnQge1ZpdGVQV0F9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIlxuaW1wb3J0IHtmYXZpY29uc30gZnJvbSBcImZhdmljb25zXCJcbmltcG9ydCBodG1sUGx1Z2luIGZyb20gXCJ2aXRlLXBsdWdpbi1odG1sLWNvbmZpZ1wiXG5pbXBvcnQgc3ZlbHRlUHJlcHJvY2VzcyBmcm9tIFwic3ZlbHRlLXByZXByb2Nlc3NcIlxuaW1wb3J0IHtzdmVsdGV9IGZyb20gXCJAc3ZlbHRlanMvdml0ZS1wbHVnaW4tc3ZlbHRlXCJcbmltcG9ydCB7bm9kZVBvbHlmaWxsc30gZnJvbSBcInZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzXCJcblxuZG90ZW52LmNvbmZpZyh7cGF0aDogXCIuZW52LmxvY2FsXCJ9KVxuZG90ZW52LmNvbmZpZyh7cGF0aDogXCIuZW52XCJ9KVxuXG5jb25zdCBhY2NlbnRDb2xvciA9IHByb2Nlc3MuZW52LlZJVEVfTElHSFRfVEhFTUUubWF0Y2goL2FjY2VudDooI1xcdyspLylbMV1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKGFzeW5jICgpID0+IHtcbiAgY29uc3QgaWNvbnMgPSBhd2FpdCBmYXZpY29ucyhcInB1YmxpY1wiICsgcHJvY2Vzcy5lbnYuVklURV9BUFBfTE9HTylcblxuICBpZiAoIWZzLmV4aXN0c1N5bmMoXCJwdWJsaWMvaWNvbnNcIikpIGZzLm1rZGlyU3luYyhcInB1YmxpYy9pY29uc1wiKVxuXG4gIGZvciAoY29uc3Qge25hbWUsIGNvbnRlbnRzfSBvZiBpY29ucy5pbWFnZXMpIHtcbiAgICBmcy53cml0ZUZpbGVTeW5jKGBwdWJsaWMvaWNvbnMvJHtuYW1lfWAsIGNvbnRlbnRzLCBcImJpbmFyeVwiKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGh0dHBzOiBmYWxzZSxcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgfSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBzcmM6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjXCIpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHBsdWdpbnM6IFtcbiAgICAgIG5vZGVQb2x5ZmlsbHMoe1xuICAgICAgICBwcm90b2NvbEltcG9ydHM6IHRydWUsXG4gICAgICB9KSxcbiAgICAgIGh0bWxQbHVnaW4oe1xuICAgICAgICB0aXRsZTogcHJvY2Vzcy5lbnYuVklURV9BUFBfTkFNRSxcbiAgICAgICAgbWV0YXM6IFtcbiAgICAgICAgICB7bmFtZTogXCJkZXNjcmlwdGlvblwiLCBjb250ZW50OiBwcm9jZXNzLmVudi5WSVRFX0FQUF9ERVNDUklQVElPTn0sXG4gICAgICAgICAge25hbWU6IFwidGhlbWUtY29sb3JcIiwgY29udGVudDogYWNjZW50Q29sb3J9LFxuICAgICAgICAgIHtuYW1lOiBcIm9nOnRpdGxlXCIsIGNvbnRlbnQ6IHByb2Nlc3MuZW52LlZJVEVfQVBQX05BTUV9LFxuICAgICAgICAgIHtuYW1lOiBcIm9nOnR5cGVcIiwgY29udGVudDogXCJ3ZWJzaXRlXCJ9LFxuICAgICAgICAgIHtuYW1lOiBcIm9nOmRlc2NyaXB0aW9uXCIsIGNvbnRlbnQ6IHByb2Nlc3MuZW52LlZJVEVfQVBQX0RFU0NSSVBUSU9OfSxcbiAgICAgICAgICB7bmFtZTogXCJvZzppbWFnZVwiLCBjb250ZW50OiBcIi9pbWFnZXMvYmFubmVyLnBuZ1wifSxcbiAgICAgICAgICB7bmFtZTogXCJ0d2l0dGVyOmNhcmRcIiwgY29udGVudDogXCJzdW1tYXJ5X2xhcmdlX2ltYWdlXCJ9LFxuICAgICAgICAgIHtuYW1lOiBcInR3aXR0ZXI6dGl0bGVcIiwgY29udGVudDogcHJvY2Vzcy5lbnYuVklURV9BUFBfTkFNRX0sXG4gICAgICAgICAge25hbWU6IFwidHdpdHRlcjpkZXNjcmlwdGlvblwiLCBjb250ZW50OiBwcm9jZXNzLmVudi5WSVRFX0FQUF9ERVNDUklQVElPTn0sXG4gICAgICAgICAge25hbWU6IFwidHdpdHRlcjppbWFnZVwiLCBjb250ZW50OiBcIi9pbWFnZXMvYmFubmVyLnBuZ1wifSxcbiAgICAgICAgICB7cHJvcGVydHk6IFwib2c6dXJsXCIsIGNvbnRlbnQ6IHByb2Nlc3MuZW52LlZJVEVfQVBQX1VSTH0sXG4gICAgICAgICAge25hbWU6IFwibXNhcHBsaWNhdGlvbi1UaWxlQ29sb3JcIiwgY29udGVudDogYWNjZW50Q29sb3J9LFxuICAgICAgICAgIHtuYW1lOiBcIm1zYXBwbGljYXRpb24tVGlsZUltYWdlXCIsIGNvbnRlbnQ6IFwiL2ljb25zL21zdGlsZS0xNDR4MTQ0LnBuZ1wifSxcbiAgICAgICAgXSxcbiAgICAgICAgbGlua3M6IFtcbiAgICAgICAgICB7cmVsOiBcImljb25cIiwgaHJlZjogXCIvaWNvbnMvZmF2aWNvbi5pY29cIiwgc2l6ZXM6IFwiNDh4NDhcIn0sXG4gICAgICAgICAge3JlbDogXCJpY29uXCIsIGhyZWY6IFwiL2ljb25zL2Zhdmljb24tMTZ4MTYucG5nXCIsIHNpemVzOiBcImFueVwiLCB0eXBlOiBcImltYWdlL3BuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcImljb25cIiwgaHJlZjogXCIvaWNvbnMvZmF2aWNvbi0zMngzMi5wbmdcIiwgc2l6ZXM6IFwiYW55XCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiaWNvblwiLCBocmVmOiBcIi9pY29ucy9mYXZpY29uLTQ4eDQ4LnBuZ1wiLCBzaXplczogXCJhbnlcIiwgdHlwZTogXCJpbWFnZS9wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjU3eDU3XCIsIGhyZWY6IFwiL2ljb25zL2FwcGxlLXRvdWNoLWljb24tNTd4NTcucG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiYXBwbGUtdG91Y2gtaWNvblwiLCBzaXplczogXCI2MHg2MFwiLCBocmVmOiBcIi9pY29ucy9hcHBsZS10b3VjaC1pY29uLTYweDYwLnBuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcImFwcGxlLXRvdWNoLWljb25cIiwgc2l6ZXM6IFwiNzJ4NzJcIiwgaHJlZjogXCIvaWNvbnMvYXBwbGUtdG91Y2gtaWNvbi03Mng3Mi5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjc2eDc2XCIsIGhyZWY6IFwiL2ljb25zL2FwcGxlLXRvdWNoLWljb24tNzZ4NzYucG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiYXBwbGUtdG91Y2gtaWNvblwiLCBzaXplczogXCIxMTR4MTE0XCIsIGhyZWY6IFwiL2ljb25zL2FwcGxlLXRvdWNoLWljb24tMTE0eDExNC5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjEyMHgxMjBcIiwgaHJlZjogXCIvaWNvbnMvYXBwbGUtdG91Y2gtaWNvbi0xMjB4MTIwLnBuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcImFwcGxlLXRvdWNoLWljb25cIiwgc2l6ZXM6IFwiMTQ0eDE0NFwiLCBocmVmOiBcIi9pY29ucy9hcHBsZS10b3VjaC1pY29uLTE0NHgxNDQucG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiYXBwbGUtdG91Y2gtaWNvblwiLCBzaXplczogXCIxNTJ4MTUyXCIsIGhyZWY6IFwiL2ljb25zL2FwcGxlLXRvdWNoLWljb24tMTUyeDE1Mi5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjE4MHgxODBcIiwgaHJlZjogXCIvaWNvbnMvYXBwbGUtdG91Y2gtaWNvbi0xODB4MTgwLnBuZ1wifSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZWw6IFwiaWNvblwiLFxuICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgICAgIHNpemVzOiBcIjE5MngxOTJcIixcbiAgICAgICAgICAgIGhyZWY6IFwiL2ljb25zL2FuZHJvaWQtaWNvbi0xOTJ4MTkyLnBuZ1wiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge3JlbDogXCJpY29uXCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCIsIHNpemVzOiBcIjMyeDMyXCIsIGhyZWY6IFwiL2ljb25zL2Zhdmljb24tMzJ4MzIucG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiaWNvblwiLCB0eXBlOiBcImltYWdlL3BuZ1wiLCBzaXplczogXCI5Nng5NlwiLCBocmVmOiBcIi9pY29ucy9mYXZpY29uLTk2eDk2LnBuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcImljb25cIiwgdHlwZTogXCJpbWFnZS9wbmdcIiwgc2l6ZXM6IFwiMTZ4MTZcIiwgaHJlZjogXCIvaWNvbnMvZmF2aWNvbi0xNngxNi5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJtYXNrLWljb25cIiwgaHJlZjogXCIvaW1hZ2VzL2xvZ28uc3ZnXCIsIGNvbG9yOiBcIiNGRkZGRkZcIn0sXG5cbiAgICAgICAgICB7XG4gICAgICAgICAgICByZWw6IFwiaWNvblwiLFxuICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgICAgIHNpemVzOiBcIjE0NHgxNDRcIixcbiAgICAgICAgICAgIGhyZWY6IFwiL2ljb25zL2FuZHJvaWQtY2hyb21lLTE0NHgxNDQucG5nXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZWw6IFwiaWNvblwiLFxuICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgICAgIHNpemVzOiBcIjE5MngxOTJcIixcbiAgICAgICAgICAgIGhyZWY6IFwiL2ljb25zL2FuZHJvaWQtY2hyb21lLTE5MngxOTIucG5nXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZWw6IFwiaWNvblwiLFxuICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgICAgIHNpemVzOiBcIjI1NngyNTZcIixcbiAgICAgICAgICAgIGhyZWY6IFwiL2ljb25zL2FuZHJvaWQtY2hyb21lLTI1NngyNTYucG5nXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7cmVsOiBcImljb25cIiwgdHlwZTogXCJpbWFnZS9wbmdcIiwgc2l6ZXM6IFwiMzZ4MzZcIiwgaHJlZjogXCIvaWNvbnMvYW5kcm9pZC1jaHJvbWUtMzZ4MzYucG5nXCJ9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlbDogXCJpY29uXCIsXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgc2l6ZXM6IFwiMzg0eDM4NFwiLFxuICAgICAgICAgICAgaHJlZjogXCIvaWNvbnMvYW5kcm9pZC1jaHJvbWUtMzg0eDM4NC5wbmdcIixcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtyZWw6IFwiaWNvblwiLCB0eXBlOiBcImltYWdlL3BuZ1wiLCBzaXplczogXCI0OHg0OFwiLCBocmVmOiBcIi9pY29ucy9hbmRyb2lkLWNocm9tZS00OHg0OC5wbmdcIn0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgcmVsOiBcImljb25cIixcbiAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXG4gICAgICAgICAgICBocmVmOiBcIi9pY29ucy9hbmRyb2lkLWNocm9tZS01MTJ4NTEyLnBuZ1wiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge3JlbDogXCJpY29uXCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCIsIHNpemVzOiBcIjcyeDcyXCIsIGhyZWY6IFwiL2ljb25zL2FuZHJvaWQtY2hyb21lLTcyeDcyLnBuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcImljb25cIiwgdHlwZTogXCJpbWFnZS9wbmdcIiwgc2l6ZXM6IFwiOTZ4OTZcIiwgaHJlZjogXCIvaWNvbnMvYW5kcm9pZC1jaHJvbWUtOTZ4OTYucG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiYXBwbGUtdG91Y2gtaWNvblwiLCBzaXplczogXCIxMDI0eDEwMjRcIiwgaHJlZjogXCJhcHBsZS10b3VjaC1pY29uLTEwMjR4MTAyNC5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjExNHgxMTRcIiwgaHJlZjogXCJhcHBsZS10b3VjaC1pY29uLTExNHgxMTQucG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiYXBwbGUtdG91Y2gtaWNvblwiLCBzaXplczogXCIxMjB4MTIwXCIsIGhyZWY6IFwiYXBwbGUtdG91Y2gtaWNvbi0xMjB4MTIwLnBuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcImFwcGxlLXRvdWNoLWljb25cIiwgc2l6ZXM6IFwiMTQ0eDE0NFwiLCBocmVmOiBcImFwcGxlLXRvdWNoLWljb24tMTQ0eDE0NC5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjE1MngxNTJcIiwgaHJlZjogXCJhcHBsZS10b3VjaC1pY29uLTE1MngxNTIucG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiYXBwbGUtdG91Y2gtaWNvblwiLCBzaXplczogXCIxNjd4MTY3XCIsIGhyZWY6IFwiYXBwbGUtdG91Y2gtaWNvbi0xNjd4MTY3LnBuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcImFwcGxlLXRvdWNoLWljb25cIiwgc2l6ZXM6IFwiMTgweDE4MFwiLCBocmVmOiBcImFwcGxlLXRvdWNoLWljb24tMTgweDE4MC5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjU3eDU3XCIsIGhyZWY6IFwiYXBwbGUtdG91Y2gtaWNvbi01N3g1Ny5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjYweDYwXCIsIGhyZWY6IFwiYXBwbGUtdG91Y2gtaWNvbi02MHg2MC5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjcyeDcyXCIsIGhyZWY6IFwiYXBwbGUtdG91Y2gtaWNvbi03Mng3Mi5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjc2eDc2XCIsIGhyZWY6IFwiYXBwbGUtdG91Y2gtaWNvbi03Nng3Ni5wbmdcIn0sXG4gICAgICAgIF0sXG4gICAgICB9KSxcbiAgICAgIFZpdGVQV0Eoe1xuICAgICAgICByZWdpc3RlclR5cGU6IFwiYXV0b1VwZGF0ZVwiLFxuICAgICAgICBpbmplY3RSZWdpc3RlcjogXCJhdXRvXCIsXG4gICAgICAgIHdvcmtib3g6IHtcbiAgICAgICAgICBtYXhpbXVtRmlsZVNpemVUb0NhY2hlSW5CeXRlczogNSAqIDEwMjQgKiogMiwgLy8gNSBNQiBvciBzZXQgdG8gc29tZXRoaW5nIGVsc2VcbiAgICAgICAgfSxcbiAgICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgICBuYW1lOiBwcm9jZXNzLmVudi5WSVRFX0FQUF9OQU1FLFxuICAgICAgICAgIHNob3J0X25hbWU6IHByb2Nlc3MuZW52LlZJVEVfQVBQX05BTUUsXG4gICAgICAgICAgZGVzY3JpcHRpb246IHByb2Nlc3MuZW52LlZJVEVfQVBQX0RFU0NSSVBUSU9OLFxuICAgICAgICAgIHRoZW1lX2NvbG9yOiBhY2NlbnRDb2xvcixcbiAgICAgICAgICBwcm90b2NvbF9oYW5kbGVyczogW3twcm90b2NvbDogXCJ3ZWIrbm9zdHJcIiwgdXJsOiBcIi8lc1wifV0sXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtcImNsaXBib2FyZFJlYWRcIiwgXCJjbGlwYm9hcmRXcml0ZVwiLCBcInVubGltaXRlZFN0b3JhZ2VcIl0sXG4gICAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICAgIHtzcmM6IFwiaW1hZ2VzL3B3YS02NHg2NC5wbmdcIiwgc2l6ZXM6IFwiNjR4NjRcIiwgdHlwZTogXCJpbWFnZS9wbmdcIn0sXG4gICAgICAgICAgICB7c3JjOiBcImltYWdlcy9wd2EtMTkyeDE5Mi5wbmdcIiwgc2l6ZXM6IFwiMTkyeDE5MlwiLCB0eXBlOiBcImltYWdlL3BuZ1wifSxcbiAgICAgICAgICAgIHtzcmM6IFwiaW1hZ2VzL3B3YS01MTJ4NTEyLnBuZ1wiLCBzaXplczogXCI1MTJ4NTEyXCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCIsIHB1cnBvc2U6IFwiYW55XCJ9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6IFwiaW1hZ2VzL21hc2thYmxlLWljb24tNTEyeDUxMi5wbmdcIixcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgICBwdXJwb3NlOiBcIm1hc2thYmxlXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIHN2ZWx0ZSh7XG4gICAgICAgIHByZXByb2Nlc3M6IHN2ZWx0ZVByZXByb2Nlc3MoKSxcbiAgICAgICAgb253YXJuOiAod2FybmluZywgaGFuZGxlcikgPT4ge1xuICAgICAgICAgIGlmICh3YXJuaW5nLmNvZGUuc3RhcnRzV2l0aChcImExMXktXCIpKSByZXR1cm5cbiAgICAgICAgICBpZiAod2FybmluZy5maWxlbmFtZS5pbmNsdWRlcyhcIm5vZGVfbW9kdWxlc1wiKSkgcmV0dXJuXG5cbiAgICAgICAgICBoYW5kbGVyKHdhcm5pbmcpXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICBdLFxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE0USxPQUFPLFFBQVE7QUFDM1IsT0FBTyxZQUFZO0FBQ25CLFlBQVksVUFBVTtBQUN0QixTQUFRLG9CQUFtQjtBQUMzQixTQUFRLGVBQWM7QUFDdEIsU0FBUSxnQkFBZTtBQUN2QixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLHNCQUFzQjtBQUM3QixTQUFRLGNBQWE7QUFDckIsU0FBUSxxQkFBb0I7QUFUNUIsSUFBTSxtQ0FBbUM7QUFXekMsT0FBTyxPQUFPLEVBQUMsTUFBTSxhQUFZLENBQUM7QUFDbEMsT0FBTyxPQUFPLEVBQUMsTUFBTSxPQUFNLENBQUM7QUFFNUIsSUFBTSxjQUFjLFFBQVEsSUFBSSxpQkFBaUIsTUFBTSxlQUFlLEVBQUUsQ0FBQztBQUV6RSxJQUFPLHNCQUFRLGFBQWEsWUFBWTtBQUN0QyxRQUFNLFFBQVEsTUFBTSxTQUFTLFdBQVcsUUFBUSxJQUFJLGFBQWE7QUFFakUsTUFBSSxDQUFDLEdBQUcsV0FBVyxjQUFjLEVBQUcsSUFBRyxVQUFVLGNBQWM7QUFFL0QsYUFBVyxFQUFDLE1BQU0sU0FBUSxLQUFLLE1BQU0sUUFBUTtBQUMzQyxPQUFHLGNBQWMsZ0JBQWdCLElBQUksSUFBSSxVQUFVLFFBQVE7QUFBQSxFQUM3RDtBQUVBLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNUO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxXQUFXO0FBQUEsSUFDYjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FB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TSwrQkFBOEI7QUFBQSxVQUNoRixFQUFDLEtBQUssb0JBQW9CLE9BQU8sU0FBUyxNQUFNLDZCQUE0QjtBQUFBLFVBQzVFLEVBQUMsS0FBSyxvQkFBb0IsT0FBTyxTQUFTLE1BQU0sNkJBQTRCO0FBQUEsVUFDNUUsRUFBQyxLQUFLLG9CQUFvQixPQUFPLFNBQVMsTUFBTSw2QkFBNEI7QUFBQSxVQUM1RSxFQUFDLEtBQUssb0JBQW9CLE9BQU8sU0FBUyxNQUFNLDZCQUE0QjtBQUFBLFFBQzlFO0FBQUEsTUFDRixDQUFDO0FBQUEsTUFDRCxRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsUUFDZCxnQkFBZ0I7QUFBQSxRQUNoQixTQUFTO0FBQUEsVUFDUCwrQkFBK0IsSUFBSSxRQUFRO0FBQUE7QUFBQSxRQUM3QztBQUFBLFFBQ0EsVUFBVTtBQUFBLFVBQ1IsTUFBTSxRQUFRLElBQUk7QUFBQSxVQUNsQixZQUFZLFFBQVEsSUFBSTtBQUFBLFVBQ3hCLGFBQWEsUUFBUSxJQUFJO0FBQUEsVUFDekIsYUFBYTtBQUFBLFVBQ2IsbUJBQW1CLENBQUMsRUFBQyxVQUFVLGFBQWEsS0FBSyxNQUFLLENBQUM7QUFBQSxVQUN2RCxhQUFhLENBQUMsaUJBQWlCLGtCQUFrQixrQkFBa0I7QUFBQSxVQUNuRSxPQUFPO0FBQUEsWUFDTCxFQUFDLEtBQUssd0JBQXdCLE9BQU8sU0FBUyxNQUFNLFlBQVc7QUFBQSxZQUMvRCxFQUFDLEtBQUssMEJBQTBCLE9BQU8sV0FBVyxNQUFNLFlBQVc7QUFBQSxZQUNuRSxFQUFDLEtBQUssMEJBQTBCLE9BQU8sV0FBVyxNQUFNLGFBQWEsU0FBUyxNQUFLO0FBQUEsWUFDbkY7QUFBQSxjQUNFLEtBQUs7QUFBQSxjQUNMLE9BQU87QUFBQSxjQUNQLE1BQU07QUFBQSxjQUNOLFNBQVM7QUFBQSxZQUNYO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGLENBQUM7QUFBQSxNQUNELE9BQU87QUFBQSxRQUNMLFlBQVksaUJBQWlCO0FBQUEsUUFDN0IsUUFBUSxDQUFDLFNBQVMsWUFBWTtBQUM1QixjQUFJLFFBQVEsS0FBSyxXQUFXLE9BQU8sRUFBRztBQUN0QyxjQUFJLFFBQVEsU0FBUyxTQUFTLGNBQWMsRUFBRztBQUUvQyxrQkFBUSxPQUFPO0FBQUEsUUFDakI7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
