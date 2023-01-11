import {uniq, pluck, groupBy, identity} from 'ramda'
import {ensurePlural, createMap} from 'hurdak/lib/hurdak'
import {findReply, personKinds, Tags, getTagValues} from 'src/util/nostr'
import {now, timedelta} from 'src/util/misc'
import {load, db, getPerson} from 'src/agent'
import defaults from 'src/agent/defaults'

const getStalePubkeys = pubkeys => {
  // If we're not reloading, only get pubkeys we don't already know about
  return uniq(pubkeys).filter(pubkey => {
    const p = getPerson(pubkey)

    return !p || p.updated_at < now() - timedelta(1, 'days')
  })
}

const loadPeople = (relays, pubkeys, {kinds = personKinds, force = false, ...opts} = {}) => {
  pubkeys = uniq(pubkeys)

  // If we're not reloading, only get pubkeys we don't already know about
  if (!force) {
    pubkeys = getStalePubkeys(pubkeys)
  }

  return pubkeys.length > 0 ? load(relays, {kinds, authors: pubkeys}, opts) : []
}

const loadNetwork = async (relays, pubkey) => {
  // Get this user's profile to start with. This may update what relays
  // are available, so don't assign relays to a variable here.
  let events = pubkey ? await loadPeople(relays, [pubkey], {force: true}) : []
  let petnames = Tags.from(events.filter(e => e.kind === 3)).type("p").all()

  // Default to some cool guys we know
  if (petnames.length === 0) {
    petnames = defaults.petnames
  }

  // Get the user's follows, with a fallback if we have no pubkey, then use nip-2 recommended
  // relays to load our user's second-order follows in order to bootstrap our social graph
  await Promise.all(
    Object.entries(groupBy(t => t[2], petnames))
      .map(([relay, petnames]) => loadPeople([relay], getTagValues(petnames)))
  )
}

const loadContext = async (relays, notes, {loadParents = true} = {}) => {
  notes = ensurePlural(notes)

  if (notes.length === 0) {
    return notes
  }

  const authors = getStalePubkeys(pluck('pubkey', notes))
  const parentTags = loadParents ? uniq(notes.map(findReply).filter(identity)) : []
  const filter = [{kinds: [1, 7], '#e': pluck('id', notes)}]

  if (authors.length > 0) {
    filter.push({kinds: personKinds, authors})
  }

  if (parentTags.length > 0) {
    filter.push({kinds: [1], ids: getTagValues(parentTags)})
    relays = uniq(relays.concat(Tags.wrap(parentTags).relays()))
  }

  const events = await load(relays, filter)

  if (parentTags.length === 0) {
    return events
  }

  const eventsById = createMap('id', events)
  const parents = getTagValues(parentTags).map(id => eventsById[id]).filter(identity)

  return events.concat(await loadContext(relays, parents, {loadParents: false}))
}

const loadNotesContext = async (relays, notes, {loadParents = false} = {}) => {
  notes = ensurePlural(notes)

  if (notes.length === 0) {
    return
  }

  const authors = uniq(pluck('pubkey', notes)).filter(k => !getPerson(k))
  const parentIds = loadParents ? uniq(notes.map(findReply).filter(identity)) : []
  const filter = [{kinds: [1, 5, 7], '#e': pluck('id', notes)}]

  // Load authors if needed
  if (authors.length > 0) {
    filter.push({kinds: personKinds, authors})
  }

  // Load the note parents
  if (parentIds.length > 0) {
    filter.push({kinds: [1], ids: parentIds})
  }

  // Load the events
  const events = await load(relays, filter)
  const eventsById = createMap('id', events)
  const parents = parentIds.map(id => eventsById[id]).filter(identity)

  // Load the parents' context as well
  if (parents.length > 0) {
    await loadNotesContext(relays, parents)
  }
}

const getOrLoadNote = async (relays, id) => {
  if (!await db.events.get(id)) {
    await load(relays, {kinds: [1], ids: [id]})
  }

  const note = await db.events.get(id)

  if (note) {
    await loadNotesContext(relays, [note], {loadParent: true})
  }

  return note
}

export default {getOrLoadNote, loadNotesContext, loadNetwork, loadPeople, personKinds, loadContext}
