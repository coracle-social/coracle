import * as nip19 from "nostr-tools/nip19"
import {fromNostrURI, Address} from "@welshman/util"
import {last, identity, tryCatch, uniq, parseJson} from "@welshman/lib"
import {RelayLists} from "@welshman/app"
import {Router} from "src/util/router"
import {app} from "src/engine/core"
import {parseAnythingSync} from "src/util/nostr"
import {getChannelId} from "src/engine"

// Decoders

export const decodeAs = (name, decode) => v => ({[name]: decode(v)})
export const encodeCsv = xs => xs.join(",")
export const decodeCsv = x => x.split(",")
export const encodeRelays = xs => xs.map(url => last(url.split("//"))).join(",")
export const encodeNaddr = a => Address.from(a).toNaddr()

// Serializers

export const asString = name => ({
  encode: identity,
  decode: decodeAs(name, identity),
})

export const asJson = name => ({
  encode: JSON.stringify,
  decode: decodeAs(name, parseJson),
})

export const asCsv = name => ({
  encode: encodeCsv,
  decode: decodeAs(name, decodeCsv),
})

export const asUrlComponent = name => ({
  encode: encodeURIComponent,
  decode: decodeAs(name, decodeURIComponent),
})

export const asEntity = {
  encode: identity,
  decode: parseAnythingSync,
}

export const asNote = {
  encode: nip19.noteEncode,
  decode: entity => {
    const annotateEvent = id => ({
      id,
      relays: [],
      note: tryCatch(() => nip19.noteEncode(id)),
      nevent: tryCatch(() => nip19.neventEncode({id, relays: []})),
    })

    entity = fromNostrURI(entity)

    let type, data
    try {
      ;({type, data} = nip19.decode(entity))
    } catch (e) {
      return annotateEvent(entity)
    }

    switch (type) {
      case "nevent":
        return {...data, note: nip19.noteEncode(data.id), nevent: nip19.neventEncode(data)}
      case "naddr":
        return {...data, address: Address.fromNaddr(entity).toString()}
      case "note":
        return annotateEvent(data)
      default:
        return annotateEvent(entity)
    }
  },
}

// A pubkey's own write relays, read straight out of the relay list collection. Full relay
// selection is async now, and these are url serializers that have to answer synchronously — this
// is the hint the DSL would have started from anyway.
const getWriteRelays = (pubkey: string) => app.get().use(RelayLists).writeUrls(pubkey).get()

export const asPerson = {
  encode: nip19.npubEncode,
  decode: entity => {
    const parsed = parseAnythingSync(entity)

    if (parsed?.type === "npub") {
      const {data: pubkey} = parsed

      return {
        pubkey,
        relays: getWriteRelays(pubkey),
      }
    }

    if (parsed?.type === "nprofile") {
      const {pubkey, relays = []} = parsed.data

      return {
        pubkey,
        relays: uniq([...relays, ...getWriteRelays(pubkey)]),
      }
    }

    return {
      pubkey: entity,
      relays: [],
    }
  },
}

export const asRelay = {
  encode: encodeURIComponent,
  decode: decodeAs("url", decodeURIComponent),
}

export const asChannelId = {
  encode: getChannelId,
  decode: decodeAs("pubkeys", decodeCsv),
}

export const asNaddr = k => ({
  encode: encodeNaddr,
  decode: decodeAs(k, naddr => Address.fromNaddr(naddr).toString()),
})

// Router and extensions

export const router = new Router()

router.extend("qrcode", encodeURIComponent)
router.extend("media", encodeURIComponent)
router.extend("relays", encodeURIComponent)
router.extend("channels", getChannelId)
router.extend("events", encodeNaddr)
router.extend("lists", encodeNaddr)
router.extend("listings", encodeNaddr)

router.extend("notes", (id, {relays = []} = {}) => {
  if (Address.isAddress(id)) {
    return Address.from(id, relays).toNaddr()
  }

  return nip19.neventEncode({id, relays})
})

router.extend("people", (pubkey, {relays = []} = {}) => {
  if (relays.length < 3) {
    relays = uniq([...relays, ...getWriteRelays(pubkey)]).slice(0, 3)
  }

  return nip19.nprofileEncode({pubkey, relays})
})
