import {writable} from 'svelte/store'
import {getLocalJson, setLocalJson} from "src/util/misc"
import {user} from 'src/state/user'

export const rooms = writable(getLocalJson("coracle/rooms") || {})

rooms.subscribe($rooms => {
  setLocalJson("coracle/rooms", $rooms)
})

export const accounts = writable(getLocalJson("coracle/accounts") || {})

accounts.subscribe($accounts => {
  setLocalJson("coracle/accounts", $accounts)
})

user.subscribe($user => {
  if ($user) {
    accounts.update($accounts => ({...$accounts, [$user.pubkey]: $user}))
  }
})
