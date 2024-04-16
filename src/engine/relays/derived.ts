import {pluck, defaultTo} from "ramda"
import {user} from "src/engine/session/derived"
import {relays} from "./state"
import {getRelaySearch, getSearchableRelays} from "./utils"

export const searchRelays = relays.derived(getRelaySearch)

export const searchRelayUrls = searchRelays.derived(search => term => pluck('url', search(term)))

export const searchableRelays = relays.derived(getSearchableRelays)

export const relayPolicies = user.derived($user => $user?.relays || [])

export const relayPolicyUrls = relayPolicies.derived(pluck("url"))

export const deriveRelay = url => relays.key(url).derived(defaultTo({url}))

export const deriveHasRelay = url => relayPolicyUrls.derived(urls => urls.includes(url))
