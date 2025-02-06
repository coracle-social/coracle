import {hexToBytes, bytesToHex} from "@noble/hashes/utils"
import * as nip19 from "nostr-tools/nip19"
import {range, DAY} from "@welshman/lib"

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

export const day = (seconds: number) => Math.floor(seconds / DAY)

export const daysBetween = (start: number, end: number) => [...range(start, end, DAY)].map(day)
