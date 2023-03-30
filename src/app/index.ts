import type {DisplayEvent} from "src/util/types"
import {omit, sortBy} from "ramda"
import {createMap} from "hurdak/lib/hurdak"
import {findReplyId} from "src/util/nostr"
import {getUserFollows} from "src/agent/social"
import {getUserReadRelays} from "src/agent/relays"
import network from "src/agent/network"
import keys from "src/agent/keys"
import listener from "src/app/listener"
import {modal, toast} from "src/app/ui"

export const loadAppData = async pubkey => {
  if (getUserReadRelays().length > 0) {
    // Start our listener, but don't wait for it
    listener.listen(pubkey)

    // Make sure the user and their network is loaded
    await network.loadPeople([pubkey], {force: true})
    await network.loadPeople(getUserFollows())
  }
}

export const login = (method, key) => {
  keys.login(method, key)

  modal.set({type: "login/connect", noEscape: true})
}

export const mergeParents = (notes: Array<DisplayEvent>) => {
  const notesById = createMap("id", notes) as Record<string, DisplayEvent>
  const childIds = []

  for (const note of Object.values(notesById)) {
    const parentId = findReplyId(note)

    if (parentId) {
      childIds.push(note.id)
    }

    // Add the current note to its parents replies, but only if we found a parent
    if (notesById[parentId]) {
      notesById[parentId].replies = notesById[parentId].replies.concat([note])
    }
  }

  return sortBy(e => -e.created_at, Object.values(omit(childIds, notesById)))
}

export const publishWithToast = (relays, thunk) =>
  thunk.publish(relays, ({completed, succeeded, failed, timeouts, pending}) => {
    let message = `Published to ${succeeded.size}/${relays.length} relays`

    const extra = []
    if (failed.size > 0) {
      extra.push(`${failed.size} failed`)
    }

    if (timeouts.size > 0) {
      extra.push(`${timeouts.size} timed out`)
    }

    if (pending.size > 0) {
      extra.push(`${pending.size} pending`)
    }

    if (extra.length > 0) {
      message += ` (${extra.join(", ")})`
    }

    toast.show("info", message, pending.size ? null : 5)
  })
