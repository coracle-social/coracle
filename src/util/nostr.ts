import {Tags} from "paravel"
import {last} from 'ramda'
import {nip19} from "nostr-tools"
import {pick, is, mergeLeft, identity} from "ramda"
import {between, avg} from "hurdak"
import type {Filter, Event} from "src/engine"
import {tryJson} from 'src/util/misc'

export const noteKinds = [1, 30023, 1063, 9802, 1808, 32123]
export const personKinds = [0, 2, 3, 10000, 10002]
export const reactionKinds = [7, 9735]
export const userKinds = [...personKinds, 30001, 30078]

export const LOCAL_RELAY_URL = "local://coracle.relay"

export const appDataKeys = {
  USER_SETTINGS: "nostr-engine/User/settings/v1",
  NIP04_LAST_CHECKED: "nostr-engine/Nip04/last_checked/v1",
  NIP24_LAST_CHECKED: "nostr-engine/Nip24/last_checked/v1",
}

export const isLike = (content: string) =>
  ["", "+", "🤙", "👍", "❤️", "😎", "🏅", "🫂", "🤣", "😂", "💜"].includes(content)

export const channelAttrs = ["name", "about", "picture"]

export const asNostrEvent = e =>
  pick(["content", "created_at", "id", "kind", "pubkey", "sig", "tags"], e) as Event

export const toHex = (data: string): string | null => {
  if (data.match(/[a-zA-Z0-9]{64}/)) {
    return data
  }

  try {
    return nip19.decode(data).data as string
  } catch (e) {
    return null
  }
}

export const mergeFilter = (filter: Filter | Filter[], extra: Filter) =>
  is(Array, filter) ? filter.map(mergeLeft(extra)) : {...filter, ...extra}

export const getRating = (event: Event) => {
  const tags = Tags.from(event)
  const rating = parseInt(tags.nthEq(2, "rating").values().first())

  if (!isNaN(rating)) {
    return rating
  }

  const json = tryJson(() => {
    return JSON.parse(last(tags.nthEq(1, "review/relay").first()))
  })

  return (json as {quality?: number})?.quality
}

export const getAvgRating = (events: Event[]) => avg(events.map(getRating).filter(identity))

export const isHex = x => x.match(/^[a-f0-9]{64}$/)

export const getIdOrNaddr = e => {
  if (between(9999, 20000, e.kind) || between(39999, 40000, e.kind)) {
    return `${e.kind}:${e.pubkey}:${Tags.from(e).getValue("d")}`
  }

  return e.id
}

const WARN_TAGS = new Set([
  "nsfw",
  "nude",
  "nudity",
  "porn",
  "ass",
  "boob",
  "boobstr",
  "sex",
  "sexy",
  "fuck",
])

export const getContentWarning = e => {
  const tags = Tags.from(e)
  const warning = tags.type("content-warning").values().first()

  if (warning) {
    return warning
  }

  return tags.topics().find(t => WARN_TAGS.has(t.toLowerCase()))
}
