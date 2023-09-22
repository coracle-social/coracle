import {pluck} from 'ramda'
import {user} from 'src/engine/session/derived'
import {relays} from './state'
import {getRelaySearch, getSearchableRelays} from "./utils"

export const searchRelays = relays.derived(getRelaySearch)

export const searchableRelays = relays.derived(getSearchableRelays)

export const relayPolicies = user.derived($user => $user.relays || [])

export const relayPolicyUrls = relayPolicies.derived(pluck("url"))

export const deriveHasRelay = url => relayPolicyUrls.derived(urls => urls.includes(url))
