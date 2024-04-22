import {last, fromPairs, identity} from "ramda"
import {
  encodeAddress,
  decodeAddress,
  addressFromNaddr,
  addressToNaddr,
  fromNostrURI,
} from "@welshman/util"
import {nip19} from "nostr-tools"
import {Router} from "src/util/router"
import {tryJson} from "src/util/misc"
import {decodePerson, decodeRelay, decodeEvent, getChannelId, hints} from "src/engine"

// Decoders

export const decodeAs = (name, decode) => v => ({[name]: decode(v)})
export const encodeJson = value => JSON.stringify(value)
export const decodeJson = json => tryJson(() => JSON.parse(json))
export const encodeCsv = xs => xs.join(",")
export const decodeCsv = x => x.split(",")
export const encodeRelays = xs => xs.map(url => last(url.split("//"))).join(",")
export const encodeNaddr = a => addressToNaddr(decodeAddress(a, []))

export const encodeFilter = f =>
  Object.entries(f)
    .map(([k, v]) => [k, Array.isArray(v) ? encodeCsv(v) : v].join(":"))
    .join("|")

export const decodeFilter = s =>
  fromPairs(
    s.split("|").map(p => {
      const [k, v] = p.split(":")

      if (k === "search") {
        return [k, v]
      }

      if (["since", "until", "limit"].includes(k)) {
        return [k, parseInt(v)]
      }

      if (k === "kinds") {
        return [k, v.split(",").map(k => parseInt(k))]
      }

      if (k === "authors" && v.length < 64) {
        return [k, v]
      }

      return [k, v.split(",")]
    }),
  )

export const decodeEntity = entity => {
  entity = fromNostrURI(entity)

  let type, data

  try {
    ;({type, data} = nip19.decode(entity) as {type: string; data: any})
  } catch (e) {
    // pass
  }

  return {type, data, relays: hints.scenario([data?.relays || []]).getUrls()}
}

// Serializers

export const asString = name => ({
  encode: identity,
  decode: decodeAs(name, identity),
})

export const asJson = name => ({
  encode: encodeJson,
  decode: decodeAs(name, decodeJson),
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
  decode: decodeEntity,
}

export const asNote = {
  encode: nip19.noteEncode,
  decode: decodeEvent,
}

export const asPerson = {
  encode: nip19.npubEncode,
  decode: decodePerson,
}

export const asRelay = {
  encode: nip19.nrelayEncode,
  decode: decodeRelay,
}

export const asFilter = {
  encode: encodeFilter,
  decode: decodeAs("filter", decodeFilter),
}

export const asChannelId = {
  encode: getChannelId,
  decode: decodeAs("pubkeys", decodeCsv),
}

export const asNaddr = k => ({
  encode: encodeNaddr,
  decode: decodeAs(k, naddr => encodeAddress(addressFromNaddr(naddr))),
})

// Router and extensions

export const router = new Router()

router.extend("qrcode", encodeURIComponent)
router.extend("media", encodeURIComponent)
router.extend("relays", nip19.nrelayEncode)
router.extend("channels", getChannelId)
router.extend("groups", encodeNaddr)
router.extend("events", encodeNaddr)
router.extend("lists", encodeNaddr)
router.extend("listings", encodeNaddr)

router.extend("notes", (id, {relays = []} = {}) => {
  if (id.includes(":")) {
    return addressToNaddr(decodeAddress(id, relays))
  }

  if (relays.length > 0) {
    return nip19.neventEncode({id, relays})
  }

  return nip19.noteEncode(id)
})

router.extend("people", (pubkey, {relays = []} = {}) => {
  if (relays.length < 3) {
    relays = relays.concat(
      hints
        .FromPubkeys([pubkey])
        .limit(3 - relays.length)
        .getUrls(),
    )
  }

  return nip19.nprofileEncode({pubkey, relays})
})
