import type {Person, DisplayEvent} from 'src/util/types'
import {assoc, omit, sortBy, whereEq, identity, when, reject} from 'ramda'
import {navigate} from 'svelte-routing'
import {createMap, ellipsize} from 'hurdak/lib/hurdak'
import {get} from 'svelte/store'
import {renderContent} from 'src/util/html'
import {Tags, displayPerson, findReplyId} from 'src/util/nostr'
import {user, getNetwork} from 'src/agent/helpers'
import {getUserWriteRelays} from 'src/agent/relays'
import defaults from 'src/agent/defaults'
import database from 'src/agent/database'
import network from 'src/agent/network'
import keys from 'src/agent/keys'
import cmd from 'src/agent/cmd'
import alerts from 'src/app/alerts'
import messages from 'src/app/messages'
import {toast, routes, modal, settings, logUsage} from 'src/app/ui'

export {toast, modal, settings, alerts, messages, logUsage}

export const loadAppData = pubkey =>
  Promise.all([
    alerts.load(pubkey),
    alerts.listen(pubkey),
    messages.listen(pubkey),
    network.loadPeople(getNetwork(pubkey)),
  ])

export const login = async ({privkey, pubkey}: {privkey?: string, pubkey?: string}) => {
  if (privkey) {
    keys.setPrivateKey(privkey)
  } else {
    keys.setPublicKey(pubkey)
  }

  modal.set({type: 'message', message: "Loading your profile data...", spinner: true})

  // Load our user so we can populate network and show profile info
  await network.loadPeople([pubkey])

  // Load network and start listening, but don't wait for it
  loadAppData(pubkey)

  // Not ideal, but the network tab depends on the user's social network being
  // loaded, so put them on global when they first log in so we're not slowing
  // down users' first run experience too much
  navigate('/notes/network')
}

export const addRelay = async url => {
  const person = get(user) as Person
  const modify = relays => relays.concat({url, write: '!'})

  // Set to defaults to support anonymous usage
  defaults.relays = modify(defaults.relays)

  if (person) {
    const relays = modify(person.relays || [])

    // Publish to the new set of relays
    await cmd.setRelays(relays, relays)

    // Reload alerts, messages, etc
    await loadAppData(person.pubkey)
  }
}

export const removeRelay = async url => {
  const person = get(user) as Person
  const modify = relays => reject(whereEq({url}), relays)

  // Set to defaults to support anonymous usage
  defaults.relays = modify(defaults.relays)

  if (person) {
    await cmd.setRelays(getUserWriteRelays(), modify(person.relays || []))
  }
}

export const setRelayWriteCondition = async (url, write) => {
  const person = get(user) as Person
  const modify = relays => relays.map(when(whereEq({url}), assoc('write', write)))

  // Set to defaults to support anonymous usage
  defaults.relays = modify(defaults.relays)

  if (person) {
    await cmd.setRelays(getUserWriteRelays(), modify(person.relays || []))
  }
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

export const asDisplayEvent = event =>
  ({children: [], replies: [], reactions: [], ...event}) as DisplayEvent

export const mergeParents = (notes: Array<DisplayEvent>) => {
  const notesById = createMap('id', notes) as Record<string, DisplayEvent>
  const childIds = []

  for (const note of Object.values(notesById)) {
    const parentId = findReplyId(note)

    if (parentId) {
      childIds.push(note.id)
    }

    // Add the current note to its parents children, but only if we found a parent
    if (notesById[parentId]) {
      notesById[parentId].children = notesById[parentId].children.concat([note])
    }
  }

  return sortBy(e => -e.created_at, Object.values(omit(childIds, notesById)))
}
