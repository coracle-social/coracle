#!/usr/bin/env node
/**
 * Namecoin ElectrumX HTTP Proxy
 *
 * Bridges browser HTTP requests to ElectrumX TCP/TLS JSON-RPC.
 * Browsers cannot make raw TCP connections, so this proxy handles
 * all ElectrumX protocol details (scripthash computation, transaction
 * fetching, NAME_UPDATE script parsing) and returns clean JSON.
 *
 * Deployment options:
 *   1. Vite dev middleware (automatic via vite.config.js plugin)
 *   2. Standalone Node.js server (this file)
 *   3. Cloudflare Worker / Vercel Edge Function (adapt the handler)
 *
 * Usage:
 *   node proxy/electrumx-proxy.mjs [--port 8089] [--host nmc2.bitcoins.sk] [--electrum-port 57001] [--tls]
 *
 * Endpoints:
 *   GET /name/:name  → resolve a Namecoin name (e.g. /name/d/testls)
 *   GET /health      → health check
 */

import {createServer} from "http"
import {nameShow, NAME_EXPIRE_DEPTH} from "./electrumx-client.mjs"

// ── Config ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
function arg(name, fallback) {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback
}

const PORT = parseInt(arg("port", "8089"))
const ELECTRUMX_HOST = arg("host", "nmc2.bitcoins.sk")
const ELECTRUMX_PORT = parseInt(arg("electrum-port", "57001"))
const USE_TLS = args.includes("--tls")

// ── HTTP server ────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url, `http://${req.headers.host}`)

  if (url.pathname === "/health") {
    res.writeHead(200, {"Content-Type": "application/json"})
    res.end(JSON.stringify({status: "ok", electrumx: `${ELECTRUMX_HOST}:${ELECTRUMX_PORT}`, tls: USE_TLS}))
    return
  }

  const nameMatch = url.pathname.match(/^\/name\/(.+)$/)
  if (nameMatch && req.method === "GET") {
    const namecoinName = decodeURIComponent(nameMatch[1])
    console.log(`[${new Date().toISOString()}] Resolving: ${namecoinName}`)

    try {
      const result = await nameShow(namecoinName, ELECTRUMX_HOST, ELECTRUMX_PORT, USE_TLS)
      if (result.error === "name_not_found") {
        res.writeHead(404, {"Content-Type": "application/json"})
      } else if (result.error === "name_expired") {
        res.writeHead(410, {"Content-Type": "application/json"})
      } else {
        res.writeHead(200, {"Content-Type": "application/json"})
      }
      res.end(JSON.stringify(result))
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Error:`, e.message)
      res.writeHead(502, {"Content-Type": "application/json"})
      res.end(JSON.stringify({error: "upstream_error", message: e.message}))
    }
    return
  }

  res.writeHead(404, {"Content-Type": "application/json"})
  res.end(JSON.stringify({error: "not_found"}))
})

server.listen(PORT, () => {
  console.log(`ElectrumX HTTP proxy listening on http://localhost:${PORT}`)
  console.log(`Upstream: ${ELECTRUMX_HOST}:${ELECTRUMX_PORT} (TLS: ${USE_TLS})`)
  console.log(`Try: curl http://localhost:${PORT}/name/d/testls`)
})
