import {get} from 'svelte/store'
import {synced, now, timedelta} from 'src/util/misc'
import {isAlert} from 'src/util/nostr'
import {listen as _listen} from 'src/agent'
import {getRelays} from 'src/app'
import loaders from 'src/app/loaders'

let listener

const start = now() - timedelta(30, 'days')

export const since = synced("app/alerts/since", start)
export const latest = synced("app/alerts/latest", start)

export const listen = async (relays, pubkey) => {
  if (listener) {
    listener.unsub()
  }

  listener = await _listen(
    relays,
    [{kinds: [1, 7], '#p': [pubkey], since: get(since)}],
    e => {
      if (isAlert(e, pubkey)) {
        loaders.loadNotesContext(getRelays(), [e])

        latest.set(Math.max(e.created_at, get(latest)))
      }
    }
  )
}

export default {latest, listen}
