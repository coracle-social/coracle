import {fromNostrURI, Address} from "@welshman/util"
import {ctx, last, identity, tryCatch} from "@welshman/lib"
import {nip19} from "nostr-tools"
import {Router} from "src/util/router"
import {parseJson} from "src/util/misc"
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

export const asPerson = {
  encode: nip19.npubEncode,
  decode: entity => {
    const parsed = parseAnythingSync(entity)

    if (parsed?.type === "npub") {
      const {data: pubkey} = parsed

      return {
        pubkey,
        relays: ctx.app.router.FromPubkeys([pubkey]).getUrls(),
      }
    }

    if (parsed?.type === "nprofile") {
      const {pubkey, relays = []} = parsed.data

      return {
        pubkey,
        relays: ctx.app.router
          .merge([ctx.app.router.FromRelays(relays), ctx.app.router.FromPubkeys([pubkey])])
          .getUrls(),
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
    relays = relays.concat(
      ctx.app.router
        .FromPubkeys([pubkey])
        .limit(3 - relays.length)
        .getUrls(),
    )
  }

  return nip19.nprofileEncode({pubkey, relays})
})

export type Serializer = {
  encode: (v: any) => string
  decode: (v: string) => any
}

export type ComponentSerializers = Record<string, Serializer>


interface RegisterOpts {
  required?: string[]
  serializers?: ComponentSerializers
  requireUser?: boolean
  requireSigner?: boolean
  preventMultipleOpening?: boolean
  modal?: boolean;
  hidden?: boolean;  
}

export type Route = RegisterOpts & {
  path: string
  component: any
  modal?: boolean    // Ajout explicite
  hidden?: boolean   // Ajout explicite
}
