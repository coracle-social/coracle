import {hexToBytes, bytesToHex} from "@noble/hashes/utils"
import * as nip19 from "nostr-tools/nip19"
import {HOUR} from "@welshman/lib"

export const displayList = <T>(xs: T[], conj = "and", n = 6, locale = "en-US") => {
  const stringItems = xs.map(String)

  if (xs.length > n + 2) {
    const formattedList = new Intl.ListFormat(locale, {style: "long", type: "unit"}).format(
      stringItems.slice(0, n),
    )

    return `${formattedList}, ${conj} ${xs.length - n} others`
  }

  return new Intl.ListFormat(locale, {style: "long", type: "conjunction"}).format(stringItems)
}

export const nsecEncode = (secret: string) => nip19.nsecEncode(hexToBytes(secret))

export const nsecDecode = (nsec: string) => {
  const {type, data} = nip19.decode(nsec)

  if (type !== "nsec") throw new Error(`Invalid nsec: ${nsec}`)

  return bytesToHex(data)
}

export const timeHash = (seconds: number, precision = 32) => {
  const alphabet = "0123456789bcdefghjkmnpqrstuvwxyz"
  const uint32 = Math.min(seconds >>> 0, 0xffffffff)
  const binary = uint32.toString(2).padStart(32, "0")
  const chunks = Math.min(Math.floor(precision / 5), 6)

  let hash = ""

  for (let i = 0; i < chunks * 5; i += 5) {
    const chunk = binary.slice(i, i + 5)
    const index = parseInt(chunk, 2)

    hash += alphabet[index]
  }

  return hash
}

export const timeHashesBetween = (a: number, b: number) => {
  const precisions = [10, 15, 20]
  const start = Math.min(a, b) >>> 0
  const end = Math.min(Math.max(a, b) >>> 0, 0xffffffff)
  const hashes = new Set<string>()

  for (let seconds = start; seconds <= end; seconds += HOUR) {
    for (const precision of precisions) {
      hashes.add(timeHash(seconds, precision))
    }
  }

  return Array.from(hashes).sort()
}
