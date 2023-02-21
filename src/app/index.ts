import type {DisplayEvent} from 'src/util/types'
import {navigate} from 'svelte-routing'
import {omit, sortBy, identity} from 'ramda'
import {createMap, ellipsize} from 'hurdak/lib/hurdak'
import {renderContent} from 'src/util/html'
import {Tags, displayPerson, findReplyId} from 'src/util/nostr'
import {getUserFollows} from 'src/agent/social'
import {getUserReadRelays} from 'src/agent/relays'
import database from 'src/agent/database'
import network from 'src/agent/network'
import keys from 'src/agent/keys'
import alerts from 'src/app/alerts'
import messages from 'src/app/messages'
import {routes, modal} from 'src/app/ui'

export const loadAppData = async pubkey => {
  if (getUserReadRelays().length > 0) {
    await Promise.all([
      alerts.listen(pubkey),
      messages.listen(pubkey),
      network.loadPeople(getUserFollows()),
    ])
  }
}

export const login = ({privkey, pubkey}: {privkey?: string, pubkey?: string}) => {
  if (privkey) {
    keys.setPrivateKey(privkey)
  } else {
    keys.setPublicKey(pubkey)
  }

  modal.set({type: 'login/connect', noEscape: true})
}

export const signup = privkey => {
  keys.setPrivateKey(privkey)

  navigate('/notes/follows')
}

export const renderNote = (note, {showEntire = false}) => {
  const shouldEllipsize = note.content.length > 500 && !showEntire
  const peopleByPubkey = createMap(
    'pubkey',
    Tags.from(note).type("p").values().all().map(k => database.people.get(k)).filter(identity)
  )

  let content

  // Ellipsize
  content = shouldEllipsize ? ellipsize(note.content, 500) : note.content

  // Escape html, replace urls
  content = renderContent(content)

  // Mentions
  content = content
    .replace(/#\[(\d+)\]/g, (tag, i) => {
      if (!note.tags[parseInt(i)]) {
        return tag
      }

      const pubkey = note.tags[parseInt(i)][1]
      const person = peopleByPubkey[pubkey] || {pubkey}
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
