import {last, identity} from "ramda"
import {Address} from "@welshman/util"
import {ctx} from "@welshman/lib"
import {nip19} from "nostr-tools"
import {Router} from "src/util/router"
import {parseJson} from "src/util/misc"
import {parseAnythingSync} from "src/util/nostr"
import {decodeEvent, getChannelId} from "src/engine"

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
  decode: decodeEvent,
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
          .merge([ctx.app.router.fromRelays(relays), ctx.app.router.FromPubkeys([pubkey])])
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
router.extend("groups", encodeNaddr)
router.extend("events", encodeNaddr)
router.extend("lists", encodeNaddr)
router.extend("listings", encodeNaddr)

router.extend("notes", (id, {relays = []} = {}) => {
  if (Address.isAddress(id)) {
    return Address.from(id, relays).toNaddr()
  }

  if (relays.length > 0) {
    return nip19.neventEncode({id, relays})
  }

  return nip19.noteEncode(id)
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
