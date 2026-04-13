/**
 * Browser-native WebSocket client for ElectrumX Namecoin queries.
 *
 * Connects directly from the browser to ElectrumX servers via WebSocket —
 * no proxy or backend required. Uses only browser-native APIs:
 *   - WebSocket for transport
 *   - crypto.subtle for SHA-256 scripthash computation
 *   - Uint8Array instead of Node.js Buffer
 *
 * Based on the approach from hzrd149/nostrudel#352.
 */
import type {NameShowResult} from "./types"
import {
  DEFAULT_ELECTRUMX_SERVERS,
  NAME_EXPIRE_DEPTH,
  OP_NAME_UPDATE,
  OP_2DROP,
  OP_DROP,
  OP_RETURN,
} from "./constants"

// ── Helpers ────────────────────────────────────────────────────────────

/** Encode a string to UTF-8 bytes */
function encodeUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

/** Convert bytes to hex string */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("")
}

/** Convert hex string to bytes */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

/** SHA-256 hash using Web Crypto API */
async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest("SHA-256", data)
  return new Uint8Array(hash)
}

/** Reverse a byte array (for ElectrumX scripthash byte order) */
function reverseBytes(bytes: Uint8Array): Uint8Array {
  const reversed = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    reversed[i] = bytes[bytes.length - 1 - i]
  }
  return reversed
}

// ── Script Construction ────────────────────────────────────────────────

/**
 * Build the canonical Namecoin name index script for a given name.
 *
 * This creates the same script that Namecoin Core indexes, which is then
 * SHA-256 hashed and reversed to form an ElectrumX "scripthash".
 *
 * Script format: OP_NAME_UPDATE <push name> OP_2DROP OP_DROP OP_RETURN
 */
function buildNameScript(name: string): Uint8Array {
  const nameBytes = encodeUtf8(name)
  const nameLen = nameBytes.length

  // Script: OP_NAME_UPDATE <pushdata name> OP_2DROP OP_DROP OP_RETURN
  const parts: number[] = [OP_NAME_UPDATE]

  // Push data length prefix (Bitcoin-style)
  if (nameLen < 0x4c) {
    parts.push(nameLen)
  } else if (nameLen <= 0xff) {
    parts.push(0x4c, nameLen)
  } else if (nameLen <= 0xffff) {
    parts.push(0x4d, nameLen & 0xff, (nameLen >> 8) & 0xff)
  } else {
    throw new Error(`Name too long: ${nameLen} bytes`)
  }

  // Name bytes
  for (let i = 0; i < nameBytes.length; i++) parts.push(nameBytes[i])

  // Tail opcodes
  parts.push(OP_2DROP, OP_DROP, OP_RETURN)

  return new Uint8Array(parts)
}

/**
 * Compute the ElectrumX scripthash for a Namecoin name.
 * scripthash = hex(reverse(sha256(script)))
 */
async function computeScripthash(name: string): Promise<string> {
  const script = buildNameScript(name)
  const hash = await sha256(script)
  return bytesToHex(reverseBytes(hash))
}

// ── Transaction Parsing ────────────────────────────────────────────────

/** Read a Bitcoin-style varint from a byte array */
function readVarint(data: Uint8Array, offset: number): [number, number] {
  const first = data[offset]
  if (first < 0xfd) return [first, offset + 1]
  if (first === 0xfd) {
    return [data[offset + 1] | (data[offset + 2] << 8), offset + 3]
  }
  if (first === 0xfe) {
    return [
      data[offset + 1] |
        (data[offset + 2] << 8) |
        (data[offset + 3] << 16) |
        (data[offset + 4] << 24),
      offset + 5,
    ]
  }
  // 0xff — 8-byte int, but we won't encounter these for script sizes
  throw new Error("Varint too large")
}

/** Read a push-data chunk from a script at the given offset */
function readPushData(script: Uint8Array, offset: number): [Uint8Array, number] {
  const opcode = script[offset]
  let len: number
  let dataStart: number

  if (opcode < 0x4c) {
    len = opcode
    dataStart = offset + 1
  } else if (opcode === 0x4c) {
    len = script[offset + 1]
    dataStart = offset + 2
  } else if (opcode === 0x4d) {
    len = script[offset + 1] | (script[offset + 2] << 8)
    dataStart = offset + 3
  } else if (opcode === 0x4e) {
    len =
      script[offset + 1] |
      (script[offset + 2] << 8) |
      (script[offset + 3] << 16) |
      (script[offset + 4] << 24)
    dataStart = offset + 5
  } else {
    throw new Error(`Not a push opcode: 0x${opcode.toString(16)}`)
  }

  return [script.slice(dataStart, dataStart + len), dataStart + len]
}

/**
 * Parse a Namecoin NAME_UPDATE value from a raw transaction hex.
 *
 * Scans all outputs for OP_NAME_UPDATE scripts and extracts the value.
 */
function parseNameValueFromTx(txHex: string, expectedName: string): string | null {
  const tx = hexToBytes(txHex)
  let offset = 4 // skip version

  // Check for segwit marker
  let isSegwit = false
  if (tx[offset] === 0x00 && tx[offset + 1] !== 0x00) {
    isSegwit = true
    offset += 2 // skip marker + flag
  }

  // Skip inputs
  let [inputCount, pos] = readVarint(tx, offset)
  offset = pos
  for (let i = 0; i < inputCount; i++) {
    offset += 32 // prevout hash
    offset += 4 // prevout index
    const [scriptLen, scriptStart] = readVarint(tx, offset)
    offset = scriptStart + scriptLen
    offset += 4 // sequence
  }

  // Parse outputs
  let [outputCount, outputPos] = readVarint(tx, offset)
  offset = outputPos

  for (let o = 0; o < outputCount; o++) {
    offset += 8 // value (satoshis)
    const [scriptLen, scriptStart] = readVarint(tx, offset)
    const scriptPubKey = tx.slice(scriptStart, scriptStart + scriptLen)
    offset = scriptStart + scriptLen

    // Look for OP_NAME_UPDATE (0x53)
    if (scriptPubKey.length > 0 && scriptPubKey[0] === OP_NAME_UPDATE) {
      try {
        // Read name
        const [nameData, afterName] = readPushData(scriptPubKey, 1)
        const name = new TextDecoder().decode(nameData)

        // Read value
        const [valueData] = readPushData(scriptPubKey, afterName)
        const value = new TextDecoder().decode(valueData)

        if (name === expectedName) {
          return value
        }
      } catch {
        // Not a valid NAME_UPDATE, continue
      }
    }
  }

  return null
}

// ── WebSocket JSON-RPC ─────────────────────────────────────────────────

interface JsonRpcRequest {
  id: number
  method: string
  params: any[]
}

interface JsonRpcResponse {
  id: number
  result?: any
  error?: {code: number; message: string}
}

/**
 * Execute a batch of JSON-RPC calls over a single WebSocket connection.
 */
function wsRpcBatch(
  serverUrl: string,
  requests: JsonRpcRequest[],
  timeoutMs = 15_000,
): Promise<JsonRpcResponse[]> {
  return new Promise((resolve, reject) => {
    let ws: WebSocket
    try {
      ws = new WebSocket(serverUrl)
    } catch (e) {
      reject(new Error(`WebSocket connection failed: ${e}`))
      return
    }

    const responses = new Map<number, JsonRpcResponse>()
    const timer = setTimeout(() => {
      ws.close()
      reject(new Error(`WebSocket timeout after ${timeoutMs}ms`))
    }, timeoutMs)

    ws.onopen = () => {
      // Send all requests as newline-delimited JSON
      for (const req of requests) {
        ws.send(JSON.stringify(req))
      }
    }

    ws.onmessage = event => {
      try {
        // Handle newline-delimited responses
        const lines = String(event.data).split("\n").filter(Boolean)
        for (const line of lines) {
          const resp: JsonRpcResponse = JSON.parse(line)
          responses.set(resp.id, resp)
        }

        // Check if we have all responses
        if (responses.size >= requests.length) {
          clearTimeout(timer)
          ws.close()
          resolve(requests.map(req => responses.get(req.id)!))
        }
      } catch (e) {
        // Partial parse — wait for more data
      }
    }

    ws.onerror = event => {
      clearTimeout(timer)
      reject(new Error(`WebSocket error connecting to ${serverUrl}`))
    }

    ws.onclose = event => {
      clearTimeout(timer)
      if (responses.size >= requests.length) return // already resolved
      if (responses.size > 0) {
        // Return what we have
        resolve(
          requests.map(
            req =>
              responses.get(req.id) ?? {
                id: req.id,
                error: {code: -1, message: "Connection closed"},
              },
          ),
        )
      } else {
        reject(new Error(`WebSocket closed before response (code: ${event.code})`))
      }
    }
  })
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Perform a Namecoin name_show lookup via WebSocket to a single ElectrumX server.
 *
 * Steps:
 *   1. Compute scripthash for the name
 *   2. Query blockchain.scripthash.listunspent to find the UTXO
 *   3. Fetch the transaction via blockchain.transaction.get
 *   4. Parse the NAME_UPDATE value from the transaction
 *   5. Check expiry based on current block height
 */
export async function nameShowWs(
  fullName: string,
  serverUrl?: string,
): Promise<NameShowResult | null> {
  const url = serverUrl ?? DEFAULT_ELECTRUMX_SERVERS[0].url
  const scripthash = await computeScripthash(fullName)

  // Step 1: Get unspent outputs for this scripthash
  const [unspentResp] = await wsRpcBatch(url, [
    {id: 1, method: "blockchain.scripthash.listunspent", params: [scripthash]},
  ])

  if (unspentResp.error || !unspentResp.result || unspentResp.result.length === 0) {
    return null // Name not found or expired
  }

  // Take the first (most recent) unspent output
  const utxo = unspentResp.result[0]
  const txHash: string = utxo.tx_hash
  const txHeight: number = utxo.height || 0

  // Step 2: Get the raw transaction and current block height
  const [txResp, headerResp] = await wsRpcBatch(url, [
    {id: 2, method: "blockchain.transaction.get", params: [txHash]},
    {id: 3, method: "blockchain.headers.subscribe", params: []},
  ])

  if (txResp.error || !txResp.result) {
    return null
  }

  const txHex: string = txResp.result
  const currentHeight: number = headerResp?.result?.height ?? 0

  // Step 3: Parse the NAME_UPDATE value from the transaction
  const value = parseNameValueFromTx(txHex, fullName)
  if (value === null) {
    return null
  }

  // Step 4: Check expiry
  const expiresIn = txHeight > 0 ? txHeight + NAME_EXPIRE_DEPTH - currentHeight : undefined
  const expired = expiresIn !== undefined && expiresIn <= 0

  return {
    name: fullName,
    value,
    txid: txHash,
    height: txHeight,
    expired,
    expiresIn: expiresIn ?? undefined,
  }
}

/**
 * Try multiple ElectrumX WebSocket servers with fallback.
 */
export async function nameShowWithFallback(
  fullName: string,
  servers?: string[],
): Promise<NameShowResult | null> {
  const urls = servers && servers.length > 0 ? servers : DEFAULT_ELECTRUMX_SERVERS.map(s => s.url)

  let lastError: Error | null = null

  for (const url of urls) {
    try {
      const result = await nameShowWs(fullName, url)
      return result
    } catch (e: any) {
      lastError = e
      // Try next server
    }
  }

  throw lastError ?? new Error("All ElectrumX servers unreachable")
}
