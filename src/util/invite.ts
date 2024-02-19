import {concatBytes} from "@noble/hashes/utils"
import {bech32} from "@scure/base"

const Bech32MaxSize = 10000

function encodeBech32(prefix: string, data: Uint8Array): string {
  return bech32.encode(prefix, bech32.toWords(data), Bech32MaxSize)
}

type TLV = {[t: number]: Uint8Array[]}

function encodeTLV(tlv: TLV): Uint8Array {
  const entries: Uint8Array[] = []

  Object.entries(tlv)
    .reverse()
    .forEach(([t, vs]: [string, Uint8Array[]]) => {
      vs.forEach((v: Uint8Array) => {
        const entry = new Uint8Array(v.length + 2)

        entry.set([parseInt(t)], 0)
        entry.set([v.length], 1)
        entry.set(v, 2)

        entries.push(entry)
      })
    })

  return concatBytes(...entries)
}

function parseTLV(data: Uint8Array): TLV {
  const result: TLV = {}

  let rest = data
  while (rest.length > 0) {
    const t = rest[0]
    const l = rest[1]
    const v = rest.slice(2, 2 + l)

    rest = rest.slice(2 + l)
    if (v.length < l) throw new Error(`not enough data to read on TLV ${t}`)
    result[t] = result[t] || []
    result[t].push(v)
  }

  return result
}

const utf8Decoder = new TextDecoder("utf-8")
const utf8Encoder = new TextEncoder()

export type InvitePointer = {
  people?: string[]
  relays?: {
    url: string
    claim?: string
  }[]
  groups?: {
    address: string
    relay: string
    claim?: string
  }[]
}

export function ninviteEncode(invite: InvitePointer): string {
  const data = encodeTLV({
    0: (invite.people || []).map(url => utf8Encoder.encode(url)),
    1: (invite.relays || []).map(({url, claim = ""}) => utf8Encoder.encode([url, claim].join("|"))),
    2: (invite.groups || []).map(({address, relay, claim = ""}) =>
      utf8Encoder.encode([address, relay, claim].join("|")),
    ),
  })

  return encodeBech32("ninvite", data)
}

export function ninviteDecode(ninvite: string): {type: "ninvite"; data: InvitePointer} {
  const {prefix, words} = bech32.decode(ninvite, Bech32MaxSize)

  if (prefix !== "ninvite") {
    throw new Error("Invalid invite string")
  }

  const tlv = parseTLV(new Uint8Array(bech32.fromWords(words)))

  return {
    type: "ninvite",
    data: {
      people: (tlv[0] || []).map(pk => utf8Decoder.decode(pk)),
      relays: (tlv[1] || []).map(value => {
        const t = utf8Decoder.decode(value)
        const i = t.indexOf("|")

        return {
          url: t.slice(0, i),
          claim: t.slice(i + 1) || null,
        }
      }),
      groups: (tlv[2] || []).map(value => {
        const t = utf8Decoder.decode(value)
        const [address, relay, ...claim] = t.split("|")

        return {address, relay, claim: claim.join("|") || null}
      }),
    },
  }
}
