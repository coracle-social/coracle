import {pluck, whereEq, sortBy, identity, when, assoc, reject} from 'ramda'
import {navigate} from 'svelte-routing'
import {createMap, ellipsize} from 'hurdak/lib/hurdak'
import {get} from 'svelte/store'
import {renderContent} from 'src/util/html'
import {Tags, displayPerson, findReplyId} from 'src/util/nostr'
import {user, people, getPerson, getRelays, keys} from 'src/agent'
import defaults from 'src/agent/defaults'
import {toast, routes, modal, settings, logUsage} from 'src/app/ui'
import cmd from 'src/app/cmd'
import alerts from 'src/app/alerts'
import messages from 'src/app/messages'
import loaders from 'src/app/loaders'

export {toast, modal, settings, alerts, messages, logUsage}

export const login = async ({privkey, pubkey}, usingExtension = false) => {
  if (privkey) {
    keys.setPrivateKey(privkey)
  } else {
    keys.setPublicKey(pubkey)
  }

  // Load network and start listening, but don't wait for it
  loaders.loadNetwork(getRelays(), pubkey),
  alerts.load(getRelays(), pubkey),
  alerts.listen(getRelays(), pubkey),
  messages.listen(getRelays(), pubkey)

  // Not ideal, but the network tab depends on the user's social network being
  // loaded, so put them on global when they first log in so we're not slowing
  // down users' first run experience too much
  navigate('/notes/global')
}

export const addRelay = async relay => {
  const person = get(user)
  const modify = relays => relays.concat(relay)

  // Set to defaults to support anonymous usage
  defaults.relays = modify(defaults.relays)

  if (person) {
    const relays = modify(person.relays || [])

    // Publish to the new set of relays
    await cmd.setRelays(relays, relays)

    await Promise.all([
      loaders.loadNetwork(relays, person.pubkey),
      alerts.load(relays, person.pubkey),
      alerts.listen(relays, person.pubkey),
      messages.listen(getRelays(), person.pubkey)
    ])
  }
}

export const removeRelay = async url => {
  const person = get(user)
  const modify = relays => reject(whereEq({url}), relays)

  // Set to defaults to support anonymous usage
  defaults.relays = modify(defaults.relays)

  if (person) {
    await cmd.setRelays(getRelays(), modify(person.relays || []))
  }
}

export const setRelayWriteCondition = async (url, write) => {
  const person = get(user)
  const modify = relays => relays.map(when(whereEq({url}), assoc('write', write)))

  // Set to defaults to support anonymous usage
  defaults.relays = modify(defaults.relays)

  if (person) {
    await cmd.setRelays(getRelays(), modify(person.relays || []))
  }
}

export const render = (note, {showEntire = false}) => {
  const shouldEllipsize = note.content.length > 500 && !showEntire
  const $people = get(people)
  const peopleByPubkey = createMap(
    'pubkey',
    Tags.from(note).type("p").values().all().map(k => $people[k]).filter(identity)
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

export const annotate = (note, context) => {
  const reactions = context.filter(e => e.kind === 7 && findReplyId(e) === note.id)
  const replies = context.filter(e => e.kind === 1 && findReplyId(e) === note.id)

  return {
    ...note, reactions,
    person: getPerson(note.pubkey),
    replies: sortBy(e => e.created_at, replies).map(r => annotate(r, context)),
  }
}

export const threadify = (events, context, {muffle = []} = {}) => {
  const contextById = createMap('id', events.concat(context))
  // Show parents when possible. For reactions, if there's no parent,
  // throw it away. Sort by created date descending
  const notes = sortBy(
    e => -e.created_at,
    events
      .map(e => contextById[findReplyId(e)] || (e.kind === 1 ? e : null))
      .filter(e => e && !muffle.includes(e.pubkey))
  )

  // Don't show notes that will also show up as children
  const noteIds = new Set(pluck('id', notes))

  // Annotate our feed with parents, reactions, replies.
  return notes
    .filter(note => !noteIds.has(findReplyId(note)))
    .map(note => {
      let parent = contextById[findReplyId(note)]

      if (parent) {
        parent = annotate(parent, context)
      }

      return annotate({...note, parent}, context)
    })
}
