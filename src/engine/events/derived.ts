import {prop, propEq} from "ramda"
import {createMap} from "hurdak"
import {derived} from "src/engine/core/utils"
import {pubkey} from "src/engine/session/state"
import {deletes, events} from "./state"

export const deletesSet = deletes.derived($deletes => new Set($deletes.map(prop("value"))))

export const userEvents = derived([pubkey, events], ([$pubkey, $events]) =>
  $pubkey ? $events.filter(propEq("pubkey", $pubkey)) : []
)

export const userEventsById = userEvents.derived($events => createMap("id", $events))
