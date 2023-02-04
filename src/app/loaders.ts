import {uniqBy, prop, uniq, flatten, pluck, identity} from 'ramda'
import {ensurePlural, createMap, chunk} from 'hurdak/lib/hurdak'
import {findReply, personKinds, Tags} from 'src/util/nostr'
import {now, timedelta} from 'src/util/misc'
import {load, getPerson} from 'src/agent'
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

  return pubkeys.length > 0
    ? load(relays, {kinds, authors: pubkeys}, opts)
    : Promise.resolve([])
}

const loadNetwork = async (relays, pubkey) => {
  // Get this user's profile to start with. This may update what relays
  // are available, so don't assign relays to a variable here.
  const events = pubkey ? await loadPeople(relays, [pubkey], {force: true}) : []
  let petnames = Tags.from(events.filter(e => e.kind === 3)).type("p").all()

  // Default to some cool guys we know
  if (petnames.length === 0) {
    petnames = defaults.petnames
  }

  const tags = Tags.wrap(petnames)

  // Use nip-2 recommended relays to load our user's second-order follows
  await loadPeople(tags.relays(), tags.values().all())
}

const loadContext = async (relays, notes, {loadParents = false, depth = 0, ...opts}: any = {}) => {
  notes = ensurePlural(notes)

  if (notes.length === 0) {
    return notes
  }

  return flatten(await Promise.all(
    chunk(256, notes).map(async chunk => {
      const chunkIds = pluck('id', chunk)
      const authors = getStalePubkeys(pluck('pubkey', chunk))
      const parentTags = uniq(chunk.map(findReply).filter(identity))
      const parentIds = Tags.wrap(parentTags).values().all()
      const combinedRelays = uniq(relays.concat(Tags.wrap(parentTags).relays()))
      const filter = [{kinds: [1, 7], '#e': chunkIds} as object]

      if (authors.length > 0) {
        filter.push({kinds: personKinds, authors})
      }

      if (loadParents && parentTags.length > 0) {
        filter.push({kinds: [1], ids: parentIds})
      }

      let events = await load(combinedRelays, filter, opts)

      // Find children, but only if we didn't already get them
      const children = events.filter(e => e.kind === 1)
      const childRelays = relays.concat(Tags.from(children).relays())

      if (depth > 0 && children.length > 0) {
        events = events.concat(
          await loadContext(childRelays, children, {depth: depth - 1, ...opts})
        )
      }

      if (loadParents && parentIds.length > 0) {
        const eventsById = createMap('id', events)
        const parents = parentIds.map(id => eventsById[id]).filter(identity)
        const parentRelays = relays.concat(Tags.from(parents).relays())

        events = events.concat(await loadContext(parentRelays, parents, opts))
      }

      // We're recurring and so may end up with duplicates here
      return uniqBy(prop('id'), events)
    })
  ))
}

export default {loadNetwork, loadPeople, personKinds, loadContext}
