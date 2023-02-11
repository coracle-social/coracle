import type {Person, DisplayEvent} from 'src/util/types'
import {groupBy, whereEq, identity, when, assoc, reject} from 'ramda'
import {navigate} from 'svelte-routing'
import {createMap, ellipsize} from 'hurdak/lib/hurdak'
import {get} from 'svelte/store'
import {renderContent} from 'src/util/html'
import {Tags, displayPerson, findReplyId} from 'src/util/nostr'
import {user, getUserRelays} from 'src/agent/helpers'
import defaults from 'src/agent/defaults'
import database from 'src/agent/database'
import network from 'src/agent/network'
import keys from 'src/agent/keys'
import cmd from 'src/agent/cmd'
import alerts from 'src/app/alerts'
import messages from 'src/app/messages'
import {toast, routes, modal, settings, logUsage} from 'src/app/ui'

export {toast, modal, settings, alerts, messages, logUsage}

export const loadAppData = pubkey => {
  const relays = getUserRelays('read')

  return Promise.all([
    network.loadNetwork(relays, pubkey),
    alerts.load(relays, pubkey),
    alerts.listen(relays, pubkey),
    messages.listen(relays, pubkey),
  ])
}

export const login = async ({privkey, pubkey}: {privkey?: string, pubkey?: string}) => {
  if (privkey) {
    keys.setPrivateKey(privkey)
  } else {
    keys.setPublicKey(pubkey)
  }

  modal.set({type: 'message', message: "Loading your profile data...", spinner: true})

  // Load network and start listening, but don't wait for it
  loadAppData(pubkey)

  // Load our user so we can populate network and show profile info
  await network.loadPeople(getUserRelays('read'), [pubkey])

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
    await cmd.setRelays(getUserRelays('write'), modify(person.relays || []))
  }
}

export const setRelayWriteCondition = async (url, write) => {
  const person = get(user) as Person
  const modify = relays => relays.map(when(whereEq({url}), assoc('write', write)))

  // Set to defaults to support anonymous usage
  defaults.relays = modify(defaults.relays)

  if (person) {
    await cmd.setRelays(getUserRelays('write'), modify(person.relays || []))
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
  ({children: [], replies: [], reactions: [], ...event})

export const mergeParents = (notes: Array<DisplayEvent>) => {
  const m = createMap('id', notes)

  return Object.entries(groupBy(findReplyId, notes))
    // Substiture parent and add notes as children
    .flatMap(([p, children]) => m[p] ? [{...m[p], children}] : children)
    // Remove replies where we failed to find a parent
    .filter((note: DisplayEvent) => !findReplyId(note) || note.children.length > 0)
}
