import Loki from "lokijs"
import {throttle} from 'throttle-debounce'
import {identity, prop, path as getPath, sortBy, partition} from 'ramda'
import IncrementalIndexedDBAdapter from "lokijs/src/incremental-indexeddb-adapter"
import {createMapOf, createMap} from "hurdak/lib/hurdak"
import {defer, union, getLocalJson, setLocalJson} from 'src/util/misc'

const Adapter = window.indexedDB ? IncrementalIndexedDBAdapter : Loki.LokiMemoryAdapter

const ready = defer()

const dead = defer()

const loki = new Loki("agent.db", {
  autoload: true,
  autosave: true,
  autosaveInterval: 4000,
  throttledSaves: true,
  adapter: new Adapter(),
  autoloadCallback: () => ready.resolve(),
})

window.addEventListener("beforeunload", () => loki.close())

type ScalarPolicy = {
  storageKey?: string,
}

const syncScalars = (engine, policies: Record<string, ScalarPolicy>) => {
  for (const [key, {storageKey}] of Object.entries(policies)) {
    const store = getPath(key.split('.'), engine)

    if (Object.hasOwn(localStorage, storageKey || key)) {
      store.set(getLocalJson(storageKey || key))
    }

    store.subscribe(throttle(300, $value => setLocalJson(storageKey, $value)))
  }
}

type CollectionPolicy = {
  storageKey?: string,
  maxRecords?: number,
  sortRecords?: (records: any[]) => any[],
}

const syncCollections = (engine, policies: Record<string, CollectionPolicy>) => {
  for (const [key, {storageKey}] of Object.entries(policies)) {
    const store = getPath(key.split('.'), engine)
    const coll = loki.addCollection(storageKey || key, {unique: ['key']})

    ready.then(() => {
      store.set(new Map(Object.entries(createMapOf('key', 'record', coll.find()))))
    })

    store.subscribe(throttle(1000, async records => {
      if (dead) {
        return
      }

      await ready

      const [updates, creates] = partition(
        ({key}) => coll.by('key', key),
        Array.from(records.entries()).map(([key, record]) => ({key, record}))
      )

      if (creates.length > 0) {
        // Something internal to loki is broken
        coll.changes = coll.changes || []
        coll.insert(creates)
      }

      if (updates.length > 0) {
        const updatesByPk = createMap('key', updates)

        coll.updateWhere(
          record => Boolean(updatesByPk[record.key]),
          existingRecord => {
            const {key, record} = updatesByPk[existingRecord.key]

            return {
              key,
              record: {
                ...existingRecord,
                ...record,
              }
            }
          }
        )
      }
    }))
  }

  // Every so often randomly prune a store
  setInterval(() => {
    const policyEntries = Object.entries(policies)
    const [key, policy] = policyEntries[Math.floor(policyEntries.length * Math.random())]
    const {maxRecords = 500, sortRecords = identity} = policy
    const store = getPath(key.split('.'), engine)
    const data = store.get()

    if (data.size < maxRecords * 1.1) {
      return
    }

    store.set(sortRecords(Array.from(data.values())).slice(-maxRecords))
  }, 30_000)
}

export class Storage {
  static contributeState() {
    return {ready, dead}
  }

  static initialize(engine) {
    syncScalars(engine, {
      'Alerts.lastChecked': {},
      'Alerts.latestNotification': {},
      'Keys.pubkey': {},
      'Keys.state': {},
      'User.settings': {},
    })

    const getPubkeyWhitelist = () => {
      const pubkeys = engine.Keys.state.all().map(prop('pubkey'))

      return union(new Set(pubkeys), engine.Social.getFollowsSet(pubkeys))
    }

    const sortByPubkeyWhitelist = fallback => records => {
      const whitelist = getPubkeyWhitelist()

      return sortBy(x => whitelist.has(x.pubkey) ? Infinity : fallback(x))
    }

    syncCollections(engine, {
      'Alerts.events': {
        maxRecords: 500,
        sortRecords: sortBy(prop('created_at')),
      },
      'Chat.channels': {
        maxRecords: 50,
        sortRecords: sortBy(e => -Math.max(e.last_checked || 0, e.last_sent || 0)),
      },
      'Chat.messages': {
        maxRecords: 10000,
        sortRecords: sortBy(prop('created_at')),
      },
      'Content.topics': {
        maxRecords: 5000,
      },
      'Content.lists': {
        maxRecords: 500,
        sortRecords: sortByPubkeyWhitelist(prop('updated_at')),
      },
      'Directory.profiles': {
        maxRecords: 5000,
        sortRecords: sortByPubkeyWhitelist(prop('updated_at')),
      },
      'Events.cache': {
        maxRecords: 5000,
        sortRecords: sortByPubkeyWhitelist(prop('created_at')),
      },
      'Nip05.handles': {
        maxRecords: 5000,
        sortRecords: sortByPubkeyWhitelist(prop('updated_at')),
      },
      'Nip57.zappers': {
        maxRecords: 5000,
        sortRecords: sortByPubkeyWhitelist(prop('updated_at')),
      },
      'Routing.relays': {
        maxRecords: 2000,
        sortRecords: prop('count'),
      },
      'Routing.policies': {
        maxRecords: 5000,
        sortRecords: sortByPubkeyWhitelist(prop('updated_at')),
      },
      'Social.graph': {
        maxRecords: 5000,
        sortRecords: sortByPubkeyWhitelist(prop('updated_at')),
      },
    })
  }
}
