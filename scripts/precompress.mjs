// Precompress build output so nginx can serve it with gzip_static/brotli_static.
// Doing this at build time means brotli quality 11 costs nothing per request --
// on-the-fly compression has to settle for a much lower level.

import {readdirSync, readFileSync, writeFileSync} from "node:fs"
import {join, extname} from "node:path"
import {gzipSync, brotliCompressSync, constants} from "node:zlib"

const DIST = "dist"
const MIN_SIZE = 1024
// woff2/png/jpg are already compressed; recompressing them just wastes space
const COMPRESSIBLE = new Set([
  ".js",
  ".css",
  ".html",
  ".svg",
  ".json",
  ".webmanifest",
  ".txt",
  ".xml",
  ".ico",
])

let count = 0
let raw = 0
let brotli = 0

const walk = dir => {
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      walk(path)
      continue
    }

    if (!COMPRESSIBLE.has(extname(entry.name))) continue

    const buf = readFileSync(path)

    if (buf.length < MIN_SIZE) continue

    const br = brotliCompressSync(buf, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11,
        [constants.BROTLI_PARAM_SIZE_HINT]: buf.length,
      },
    })

    writeFileSync(`${path}.br`, br)
    writeFileSync(`${path}.gz`, gzipSync(buf, {level: 9}))

    count += 1
    raw += buf.length
    brotli += br.length
  }
}

walk(DIST)

const mb = n => (n / 1024 ** 2).toFixed(2)

console.log(`precompressed ${count} files: ${mb(raw)} MB -> ${mb(brotli)} MB brotli`)
