/**
 * ElectrumX TCP/TLS client for Namecoin name resolution.
 *
 * Handles the full scripthash-based protocol:
 *   1. Build canonical name index script
 *   2. Compute Electrum-style scripthash (SHA-256, byte-reversed)
 *   3. Query blockchain.scripthash.get_history
 *   4. Fetch raw transaction and parse NAME_UPDATE script
 *   5. Check name expiry against current block height
 *
 * This runs server-side (Node.js) — not in the browser.
 */

import {connect as tlsConnect} from "tls"
import {connect as netConnect} from "net"
import {createHash} from "crypto"

export const NAME_EXPIRE_DEPTH = 36_000

// ── Script construction ────────────────────────────────────────────────

function pushData(data) {
  const len = data.length
  if (len < 0x4c) {
    return Buffer.concat([Buffer.from([len]), data])
  }
  if (len <= 0xff) {
    return Buffer.concat([Buffer.from([0x4c, len]), data])
  }
  const header = Buffer.alloc(3)
  header[0] = 0x4d
  header.writeUInt16LE(len, 1)
  return Buffer.concat([header, data])
}

function buildNameIndexScript(name) {
  const nameBytes = Buffer.from(name)
  const namePush = pushData(nameBytes)
  const emptyPush = pushData(Buffer.alloc(0))
  return Buffer.concat([
    Buffer.from([0x53]),              // OP_NAME_UPDATE
    namePush,
    emptyPush,
    Buffer.from([0x6d, 0x75, 0x6a]), // OP_2DROP OP_DROP OP_RETURN
  ])
}

function electrumScriptHash(script) {
  const hash = createHash("sha256").update(script).digest()
  return Buffer.from(hash).reverse().toString("hex")
}

// ── Script parsing ─────────────────────────────────────────────────────

function readPush(buf, pos) {
  if (pos >= buf.length) return null
  const op = buf[pos]
  if (op === 0) return {data: Buffer.alloc(0), nextPos: pos + 1}
  if (op < 0x4c) {
    const end = pos + 1 + op
    if (end > buf.length) return null
    return {data: buf.slice(pos + 1, end), nextPos: end}
  }
  if (op === 0x4c) {
    if (pos + 2 > buf.length) return null
    const len = buf[pos + 1]
    const end = pos + 2 + len
    if (end > buf.length) return null
    return {data: buf.slice(pos + 2, end), nextPos: end}
  }
  if (op === 0x4d) {
    if (pos + 3 > buf.length) return null
    const len = buf.readUInt16LE(pos + 1)
    const end = pos + 3 + len
    if (end > buf.length) return null
    return {data: buf.slice(pos + 3, end), nextPos: end}
  }
  return null
}

function parseNameScript(scriptHex) {
  const buf = Buffer.from(scriptHex, "hex")
  if (buf.length === 0 || buf[0] !== 0x53) return null
  let pos = 1
  const nameRead = readPush(buf, pos)
  if (!nameRead) return null
  pos = nameRead.nextPos
  const valRead = readPush(buf, pos)
  if (!valRead) return null
  return {
    name: nameRead.data.toString(),
    value: valRead.data.toString(),
  }
}

// ── JSON-RPC over TCP/TLS ──────────────────────────────────────────────

function electrumRpc(host, port, useTls, method, params, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1_000_000)
    const connectFn = useTls ? tlsConnect : netConnect
    const opts = useTls
      ? {port, host, rejectUnauthorized: false}
      : {port, host}

    const conn = connectFn(opts, () => {
      conn.write(JSON.stringify({jsonrpc: "2.0", id, method, params}) + "\n")
    })

    let buf = ""
    const timer = setTimeout(() => {
      conn.destroy()
      reject(new Error("RPC timeout"))
    }, timeoutMs)

    conn.on("data", (d) => {
      buf += d.toString()
      const lines = buf.split("\n")
      for (let i = 0; i < lines.length - 1; i++) {
        if (!lines[i].trim()) continue
        try {
          const msg = JSON.parse(lines[i])
          if (msg.id === id) {
            clearTimeout(timer)
            conn.end()
            if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)))
            else resolve(msg.result)
          }
        } catch { /* not our message */ }
      }
      buf = lines[lines.length - 1]
    })

    conn.on("error", (e) => {
      clearTimeout(timer)
      reject(e)
    })
  })
}

// ── Multi-call session ─────────────────────────────────────────────────

/**
 * Open a persistent connection, run multiple RPC calls, then close.
 * More efficient than one connection per call.
 */
function electrumSession(host, port, useTls, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const connectFn = useTls ? tlsConnect : netConnect
    const opts = useTls
      ? {port, host, rejectUnauthorized: false}
      : {port, host}

    const pending = new Map() // id → {resolve, reject}
    let buf = ""
    let nextId = 1

    const conn = connectFn(opts, () => {
      resolve({
        call(method, params) {
          return new Promise((res, rej) => {
            const id = nextId++
            pending.set(id, {resolve: res, reject: rej})
            conn.write(JSON.stringify({jsonrpc: "2.0", id, method, params}) + "\n")
          })
        },
        close() {
          conn.end()
        },
      })
    })

    conn.on("data", (d) => {
      buf += d.toString()
      const lines = buf.split("\n")
      for (let i = 0; i < lines.length - 1; i++) {
        if (!lines[i].trim()) continue
        try {
          const msg = JSON.parse(lines[i])
          const p = pending.get(msg.id)
          if (p) {
            pending.delete(msg.id)
            if (msg.error) p.reject(new Error(msg.error.message || JSON.stringify(msg.error)))
            else p.resolve(msg.result)
          }
        } catch { /* ignore */ }
      }
      buf = lines[lines.length - 1]
    })

    conn.on("error", (e) => {
      for (const p of pending.values()) p.reject(e)
      pending.clear()
      reject(e)
    })

    const timer = setTimeout(() => {
      conn.destroy()
      reject(new Error("Session timeout"))
    }, timeoutMs)

    conn.on("close", () => {
      clearTimeout(timer)
    })
  })
}

// ── Name resolution ────────────────────────────────────────────────────

/**
 * Resolve a Namecoin name to its blockchain value via ElectrumX.
 *
 * @param {string} namecoinName e.g. "d/testls" or "id/alice"
 * @param {string} host ElectrumX hostname
 * @param {number} port ElectrumX port
 * @param {boolean} useTls Use TLS connection
 * @returns {Promise<Object>} { name, value, txid, height, expires_in } or { error, name }
 */
export async function nameShow(namecoinName, host, port, useTls = false) {
  const session = await electrumSession(host, port, useTls)

  try {
    // 1. Negotiate protocol version
    await session.call("server.version", ["NMCProxy/0.1", "1.4"])

    // 2. Compute scripthash
    const script = buildNameIndexScript(namecoinName)
    const scriptHash = electrumScriptHash(script)

    // 3. Get transaction history
    const history = await session.call("blockchain.scripthash.get_history", [scriptHash])
    if (!Array.isArray(history) || history.length === 0) {
      return {error: "name_not_found", name: namecoinName}
    }

    // 4. Get latest transaction
    const latest = history[history.length - 1]
    const txHash = latest.tx_hash
    const height = latest.height

    const tx = await session.call("blockchain.transaction.get", [txHash, true])

    // 5. Check block height for expiry
    let currentHeight = null
    try {
      const headers = await session.call("blockchain.headers.subscribe", [])
      currentHeight = headers?.height ?? null
    } catch { /* non-fatal */ }

    if (currentHeight !== null && height > 0) {
      if (currentHeight - height >= NAME_EXPIRE_DEPTH) {
        return {error: "name_expired", name: namecoinName}
      }
    }

    // 6. Parse NAME_UPDATE from tx outputs
    for (const vout of (tx?.vout || [])) {
      const hex = vout?.scriptPubKey?.hex
      if (!hex || !hex.startsWith("53")) continue

      const parsed = parseNameScript(hex)
      if (!parsed || parsed.name !== namecoinName) continue

      return {
        name: parsed.name,
        value: parsed.value,
        txid: txHash,
        height,
        expires_in: currentHeight !== null && height > 0
          ? NAME_EXPIRE_DEPTH - (currentHeight - height)
          : undefined,
      }
    }

    return {error: "name_not_found", name: namecoinName}
  } finally {
    session.close()
  }
}
