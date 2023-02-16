import {pick, identity, isEmpty} from 'ramda'
import {nip05} from 'nostr-tools'
import {noop, createMap, ensurePlural, switcherFn} from 'hurdak/lib/hurdak'
import {log, warn} from 'src/util/logger'
import {now, timedelta, shuffle, hash} from 'src/util/misc'
import {personKinds, Tags, roomAttrs, isRelay} from 'src/util/nostr'
import database from 'src/agent/database'

const processEvents = async events => {
  await Promise.all([
    processProfileEvents(events),
    processRoomEvents(events),
    processMessages(events),
    processRoutes(events),
  ])
}

const processProfileEvents = async events => {
  const profileEvents = ensurePlural(events)
    .filter(e => personKinds.includes(e.kind))

  const updates = {}
  for (const e of profileEvents) {
    const person = database.getPersonWithFallback(e.pubkey)

    updates[e.pubkey] = {
      ...person,
      ...updates[e.pubkey],
      ...switcherFn(e.kind, {
        0: () => {
          return tryJson(() => {
            const content = JSON.parse(e.content)

            // Fire off a nip05 verification
            if (content.nip05 && e.created_at > (person.nip05_updated_at || 0)) {
              verifyNip05(e.pubkey, content.nip05)

              content.nip05_updated_at = e.created_at
            }

            return content
          })
        },
        3: () => ({petnames: e.tags}),
        12165: () => ({muffle: e.tags}),
        default: () => {
          log(`Received unsupported event type ${e.kind}`)
        },
      }),
      updated_at: now(),
    }
  }

  if (!isEmpty(updates)) {
    await database.people.bulkPatch(updates)
  }
}

const processRoomEvents = async events => {
  const roomEvents = ensurePlural(events)
    .filter(e => [40, 41].includes(e.kind))

  const updates = {}
  for (const e of roomEvents) {
    const content = tryJson(() => pick(roomAttrs, JSON.parse(e.content))) as Record<string, any>
    const roomId = e.kind === 40 ? e.id : Tags.from(e).type("e").values().first()

    if (!roomId || !content) {
      continue
    }

    const room = await database.rooms.get(roomId)

    // Merge edits but don't let old ones override new ones
    if (room?.edited_at >= e.created_at) {
      continue
    }

    // There are some non-standard rooms out there, ignore them
    // if they don't have a name
    if (content.name) {
      updates[roomId] = {
        joined: false,
        ...room,
        ...updates[roomId],
        ...content,
        id: roomId,
        pubkey: e.pubkey,
        edited_at: e.created_at,
        updated_at: now(),
      }
    }
  }

  if (!isEmpty(updates)) {
    await database.rooms.bulkPut(updates)
  }
}

const processMessages = async events => {
  const messages = ensurePlural(events)
    .filter(e => e.kind === 4)
    .map(e => ({...e, recipient: Tags.from(e).type("p").values().first()}))


  if (messages.length > 0) {
    await database.messages.bulkPut(createMap('id', messages))
  }
}

// Routes

const getWeight = type => {
  if (type === 'nip05') return 1
  if (type === 'kind:10002') return 1
  if (type === 'kind:3') return 0.8
  if (type === 'kind:2') return 0.5
  if (type === 'seen') return 0.2
  if (type === 'tag') return 0.1
}

const calculateRoute = (pubkey, url, type, mode, created_at) => {
  if (!isRelay(url)) {
    return
  }

  const id = hash([pubkey, url, mode].join('')).toString()
  const score = getWeight(type) * (1 - (now() - created_at) / timedelta(30, 'days'))
  const route = database.routes.get(id) || {id, pubkey, url, mode, score: 0, count: 0}

  const newTotalScore = route.score * route.count + score
  const newCount = route.count + 1

  if (score > 0) {
    return {
      ...route,
      count: newCount,
      score: newTotalScore / newCount,
      last_seen: Math.max(created_at, route.last_seen || 0),
    }
  }
}

const processRoutes = async events => {
  const updates = []

  // Sample events so we're not burning too many resources
  for (const e of ensurePlural(shuffle(events)).slice(0, 10)) {
    switcherFn(e.kind, {
      2: () => {
        updates.push(
          calculateRoute(e.pubkey, e.content, 'kind:2', 'read', e.created_at)
        )
        updates.push(
          calculateRoute(e.pubkey, e.content, 'kind:2', 'write', e.created_at)
        )
      },
      3: () => {
        tryJson(() => {
          Object.entries(JSON.parse(e.content))
            .forEach(([url, conditions]) => {
              const {write, read} = conditions as Record<string, boolean|string>

              if (![false, '!'].includes(write)) {
                updates.push(
                  calculateRoute(e.pubkey, url, 'kind:3', 'write', e.created_at)
                )
              }

              if (![false, '!'].includes(read)) {
                updates.push(
                  calculateRoute(e.pubkey, url, 'kind:3', 'read', e.created_at)
                )
              }
            })
        })
      },
      10002: () => {
        e.tags
          .forEach(([url, read, mode]) => {
            if (mode) {
              calculateRoute(e.pubkey, url, 'kind:10002', mode, e.created_at)
            } else {
              calculateRoute(e.pubkey, url, 'kind:10002', 'read', e.created_at)
              calculateRoute(e.pubkey, url, 'kind:10002', 'write', e.created_at)
            }
          })
      },
      default: noop,
    })

    // Add tag hints
    events.forEach(e => {
      Tags.wrap(e.tags).type("p").all().forEach(([_, pubkey, url]) => {
        updates.push(
          calculateRoute(pubkey, url, 'tag', 'write', e.created_at)
        )
      })
    })
  }

  if (!isEmpty(updates)) {
    await database.routes.bulkPut(createMap('id', updates.filter(identity)))
  }
}

// Utils

const tryJson = f => {
  try {
    return f()
  } catch (e) {
    if (!e.toString().includes('JSON')) {
      warn(e)
    }
  }
}

const verifyNip05 = (pubkey, as) =>
  nip05.queryProfile(as).then(result => {
    if (result?.pubkey === pubkey) {
      const person = database.getPersonWithFallback(pubkey)

      database.people.patch({...person, verified_as: as})

      if (result.relays?.length > 0) {
        database.routes.bulkPut(
          createMap('id', result.relays.filter(isRelay).flatMap(url =>[
            calculateRoute(pubkey, url, 'nip05', 'write', now()),
            calculateRoute(pubkey, url, 'nip05', 'read', now()),
          ]))
        )
      }
    }
  }, noop)

export default {processEvents}
