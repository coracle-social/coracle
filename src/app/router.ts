import {last, fromPairs, identity} from "ramda"
import {nip19} from "nostr-tools"
import {Router} from "src/util/router"
import {tryJson} from "src/util/misc"
import {fromNostrURI} from "src/util/nostr"
import {
  decodePerson,
  decodeRelay,
  decodeEvent,
  selectHints,
  normalizeRelayUrl,
  getNip24ChannelId,
} from "src/engine"

// Decoders

export const decodeAs = (name, decode) => v => ({[name]: decode(v)})
export const encodeJson = value => JSON.stringify(value)
export const decodeJson = json => tryJson(() => JSON.parse(json))
export const encodeCsv = xs => xs.join(",")
export const decodeCsv = x => x.split(",")
export const encodeRelays = xs => xs.map(url => last(url.split("//"))).join(",")
export const decodeRelays = x => x.split(",").map(normalizeRelayUrl)

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
    })
  )

export const decodeEntity = entity => {
  entity = fromNostrURI(entity)

  let type, data, relays

  try {
    ;({type, data} = nip19.decode(entity) as {type: string; data: any})
    relays = selectHints(data.relays || [], 3)
  } catch (e) {
    // pass
  }

  return {type, data, relays}
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

export const asMedia = name => ({
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
  decode: decodeAs(name, decodeFilter),
}

export const asChannelId = {
  encode: getNip24ChannelId,
  decode: decodeAs("pubkeys", decodeCsv),
}

export const asRelays = {
  encode: encodeRelays,
  decode: decodeAs("relays", decodeRelays),
}

// Router and extensions

export const router = new Router()

router.extend("media", encodeURIComponent)
router.extend("notes", nip19.noteEncode)
router.extend("people", nip19.npubEncode)
router.extend("relays", nip19.nrelayEncode)
router.extend("channels", getNip24ChannelId)
