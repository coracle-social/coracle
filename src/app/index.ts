import type {DisplayEvent} from 'src/util/types'
import {omit, sortBy} from 'ramda'
import {createMap, ellipsize} from 'hurdak/lib/hurdak'
import {renderContent} from 'src/util/html'
import {displayPerson, findReplyId} from 'src/util/nostr'
import {getUserFollows} from 'src/agent/social'
import {getUserReadRelays} from 'src/agent/relays'
import {getPersonWithFallback} from 'src/agent/state'
import network from 'src/agent/network'
import keys from 'src/agent/keys'
import alerts from 'src/app/alerts'
import {routes, modal, toast} from 'src/app/ui'

export const loadAppData = async pubkey => {
  if (getUserReadRelays().length > 0) {
    // Start our listener, but don't wait for it
    alerts.listen(pubkey)

    // Make sure the user's network is loaded
    await network.loadPeople(getUserFollows())
  }
}

export const login = (method, key) => {
  keys.login(method, key)

  modal.set({type: 'login/connect', noEscape: true})
}

export const renderNote = (note, {showEntire = false}) => {
  let content

  // Ellipsize
  content = note.content.length > 500 && !showEntire
    ? ellipsize(note.content, 500)
    : note.content

  // Escape html, replace urls
  content = renderContent(content)

  // Mentions
  content = content
    .replace(/#\[(\d+)\]/g, (tag, i) => {
      if (!note.tags[parseInt(i)]) {
        return tag
      }

      const pubkey = note.tags[parseInt(i)][1]
      const person = getPersonWithFallback(pubkey)
      const name = displayPerson(person)
      const path = routes.person(pubkey)

      return `@<a href="${path}" class="underline">${name}</a>`
    })

  return content
}

export const mergeParents = (notes: Array<DisplayEvent>) => {
  const notesById = createMap('id', notes) as Record<string, DisplayEvent>
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
      message += ` (${extra.join(', ')})`
    }

    toast.show('info', message, pending.size ? null : 5)
  })
