import {uniq, pick, identity, isEmpty} from 'ramda'
import {nip05} from 'nostr-tools'
import {noop, createMap, ensurePlural, chunk, switcherFn} from 'hurdak/lib/hurdak'
import {log} from 'src/util/logger'
import {now, sleep, tryJson, timedelta, shuffle, hash} from 'src/util/misc'
import {Tags, roomAttrs, personKinds, isRelay, isShareableRelay, normalizeRelayUrl} from 'src/util/nostr'
import database from 'src/agent/database'

const processEvents = async events => {
  await Promise.all([
    batchProcess(processProfileEvents, events),
    batchProcess(processRoomEvents, events),
    batchProcess(processRoutes, events),
  ])
}

const batchProcess = async (processChunk, events) => {
  const chunks = chunk(100, ensurePlural(events))

  // Don't lock everything up when processing a lot of events
  for (let i = 0; i < chunks.length; i++) {
    processChunk(chunks[i])

    if (i < chunks.length - 1) {
      await sleep(30)
    }
  }
}

const processProfileEvents = async events => {
  const profileEvents = events.filter(e => personKinds.includes(e.kind))

  const updates = {}
  for (const e of profileEvents) {
    const person = database.getPersonWithFallback(e.pubkey)

    updates[e.pubkey] = {
      ...person,
      ...updates[e.pubkey],
      ...switcherFn(e.kind, {
        0: () => {
          return tryJson(() => {
            const kind0 = JSON.parse(e.content)

            if (e.created_at > (person.kind0_updated_at || 0)) {
              if (kind0.nip05) {
                verifyNip05(e.pubkey, kind0.nip05)

                kind0.nip05_updated_at = e.created_at
              }

              return {
                kind0: {
                  ...person?.kind0,
                  ...updates[e.pubkey]?.kind0,
                  ...kind0,
                },
                kind0_updated_at: e.created_at,
              }
            }
          })
        },
        2: () => {
          if (e.created_at > (person.relays_updated_at || 0)) {
            const {relays = []} = database.getPersonWithFallback(e.pubkey)

            return {
              relays_updated_at: e.created_at,
              relays: relays.concat({url: e.content}),
            }
          }
        },
        3: () => {
          const data = {petnames: e.tags}

          if (e.created_at > (person.relays_updated_at || 0)) {
            tryJson(() => {
              Object.assign(data, {
                relays_updated_at: e.created_at,
                relays: Object.entries(JSON.parse(e.content))
                  .map(([url, conditions]) => {
                    const {write, read} = conditions as Record<string, boolean|string>

                    return {
                      url,
                      write: [false, '!'].includes(write) ? '!' : '',
                      read: [false, '!'].includes(read) ? '!' : '',
                    }
                  })
                  .filter(r => isRelay(r.url)),
              })
            })
          }

          return data
        },
        12165: () => ({muffle: e.tags}),
        // DEPRECATED
        10001: () => {
          if (e.created_at > (person.relays_updated_at || 0)) {
            return {
              relays_updated_at: e.created_at,
              relays: e.tags.map(([url, read, write]) =>
                ({url, read: read !== '!', write: write !== '!'})),
            }
          }
        },
        10002: () => {
          if (e.created_at > (person.relays_updated_at || 0)) {
            return {
              relays_updated_at: e.created_at,
              relays: e.tags.map(([_, url, mode]) => {
                const read = (mode || 'read') === 'read'
                const write = (mode || 'write') === 'write'

                return {url, read, write}
              }),
            }
          }
        },
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

// Chat rooms

const processRoomEvents = async events => {
  const roomEvents = events.filter(e => [40, 41].includes(e.kind))

  const updates = {}
  for (const e of roomEvents) {
    const content = tryJson(() => pick(roomAttrs, JSON.parse(e.content)))
    const roomId = e.kind === 40 ? e.id : Tags.from(e).type("e").values().first()

    // Ignore non-standard rooms that don't have a name
    if (!roomId || !content?.name) {
      continue
    }

    const room = database.rooms.get(roomId)

    // Don't let old edits override new ones
    if (room?.updated_at >= e.created_at) {
      continue
    }

    updates[roomId] = {
      ...room,
      ...updates,
      ...content,
      id: roomId,
      pubkey: e.pubkey,
      updated_at: e.created_at,
    }
  }

  if (!isEmpty(updates)) {
    await database.rooms.bulkPatch(updates)
  }
}

// Routes

const getWeight = type => {
  if (type === 'nip05') return 1
  if (type === 'kind:10002') return 1
  if (type === 'kind:3') return 0.8
  if (type === 'kind:2') return 0.5
  if (type === 'seen') return 0.2
}

const calculateRoute = (pubkey, rawUrl, type, mode, created_at) => {
  if (!isShareableRelay(rawUrl)) {
    return
  }

  const url = normalizeRelayUrl(rawUrl)
  const id = hash([pubkey, url, mode].join('')).toString()
  const score = getWeight(type) * (1 - (now() - created_at) / timedelta(30, 'days'))
  const defaults = {id, pubkey, url, mode, score: 0, count: 0, types: []}
  const route = database.routes.get(id) || defaults

  const newTotalScore = route.score * route.count + score
  const newCount = route.count + 1

  if (score > 0) {
    return {
      ...route,
      count: newCount,
      score: newTotalScore / newCount,
      types: uniq(route.types.concat(type)),
      last_seen: Math.max(created_at, route.last_seen || 0),
    }
  }
}

const processRoutes = async events => {
  let updates = []

  // Sample events so we're not burning too many resources
  for (const e of shuffle(events).slice(0, 10)) {
    switcherFn(e.kind, {
      0: () => {
        updates.push(
          calculateRoute(e.pubkey, e.content, 'seen', 'write', e.created_at)
        )
      },
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
      // DEPRECATED
      10001: () => {
        e.tags
          .forEach(([url, read, write]) => {
            if (write !== '!') {
              calculateRoute(e.pubkey, url, 'kind:10002', 'write', e.created_at)
            }

            if (read !== '!') {
              calculateRoute(e.pubkey, url, 'kind:10002', 'read', e.created_at)
            }
          })
      },
      10002: () => {
        e.tags
          .forEach(([_, url, mode]) => {
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
  }

  updates = updates.filter(identity)

  if (!isEmpty(updates)) {
    await database.relays.bulkPatch(createMap('url', updates.map(pick(['url']))))
    await database.routes.bulkPut(createMap('id', updates))
  }
}

// Utils

const verifyNip05 = (pubkey, as) =>
  nip05.queryProfile(as).then(result => {
    if (result?.pubkey === pubkey) {
      const person = database.getPersonWithFallback(pubkey)

      database.people.patch({...person, verified_as: as})

      if (result.relays?.length > 0) {
        const urls = result.relays.filter(isRelay)

        database.relays.bulkPatch(
          createMap('url', urls.map(url => ({url: normalizeRelayUrl(url)})))
        )

        database.routes.bulkPut(
          createMap('id', urls.flatMap(url => [
            calculateRoute(pubkey, url, 'nip05', 'write', now()),
            calculateRoute(pubkey, url, 'nip05', 'read', now()),
          ]).filter(identity))
        )
      }
    }
  }, noop)

export default {processEvents}
