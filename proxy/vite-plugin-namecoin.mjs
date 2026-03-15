/**
 * Vite plugin that serves /api/namecoin/* during development.
 *
 * This embeds the ElectrumX proxy directly into the Vite dev server
 * so `npm run dev` works with zero additional setup.
 *
 * In production, these requests should be handled by a hosted proxy
 * configured via VITE_NAMECOIN_PROXY_URL.
 */

import {nameShow} from "./electrumx-client.mjs"

const DEFAULT_HOST = process.env.NAMECOIN_ELECTRUMX_HOST || "nmc2.bitcoins.sk"
const DEFAULT_PORT = parseInt(process.env.NAMECOIN_ELECTRUMX_PORT || "57001")
const USE_TLS = process.env.NAMECOIN_ELECTRUMX_TLS === "true"

export default function namecoinProxy() {
  return {
    name: "namecoin-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Health check
        if (req.url === "/api/namecoin/health") {
          res.setHeader("Content-Type", "application/json")
          res.end(JSON.stringify({
            status: "ok",
            electrumx: `${DEFAULT_HOST}:${DEFAULT_PORT}`,
            tls: USE_TLS,
          }))
          return
        }

        // Name resolution: /api/namecoin/name/d/testls or /api/namecoin/name/id/alice
        const match = req.url?.match(/^\/api\/namecoin\/name\/(.+)$/)
        if (!match || req.method !== "GET") {
          next()
          return
        }

        const namecoinName = decodeURIComponent(match[1])
        console.log(`[namecoin-proxy] Resolving: ${namecoinName}`)

        try {
          const result = await nameShow(namecoinName, DEFAULT_HOST, DEFAULT_PORT, USE_TLS)

          res.setHeader("Content-Type", "application/json")
          res.setHeader("Cache-Control", "public, max-age=300") // 5 min cache

          if (result.error === "name_not_found") {
            res.statusCode = 404
          } else if (result.error === "name_expired") {
            res.statusCode = 410
          } else {
            res.statusCode = 200
          }
          res.end(JSON.stringify(result))
        } catch (e) {
          console.error(`[namecoin-proxy] Error:`, e.message)
          res.statusCode = 502
          res.setHeader("Content-Type", "application/json")
          res.end(JSON.stringify({error: "upstream_error", message: e.message}))
        }
      })
    },
  }
}
