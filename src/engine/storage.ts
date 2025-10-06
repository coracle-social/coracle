import {openDB, deleteDB} from "idb"
import type {IDBPDatabase} from "idb"
import type {Unsubscriber} from "svelte/store"
import {writable} from "svelte/store"
import {batch, sortBy, call, fromPairs, defer} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {throttled, withGetter} from "@welshman/store"
import {Tracker} from "@welshman/net"
import {freshness} from "@welshman/store"
import type {RepositoryUpdate} from "@welshman/relay"
import {Repository} from "@welshman/relay"
import {relays, handles, onHandle, zappers, onZapper, plaintext} from "@welshman/app"

export type StorageAdapterOptions = {
  throttle?: number
  migrate?: (items: any[]) => any[]
}

export type StorageAdapter = {
  keyPath: string
  init: () => Promise<void>
  sync: () => Unsubscriber
}

export let db: IDBPDatabase | undefined

export const ready = defer<void>()

export const dead = withGetter(writable(false))

export const unsubscribers: Unsubscriber[] = []

export const getAll = async (name: string) => {
  await ready

  if (!db) return []

  const tx = db.transaction(name, "readwrite")
  const store = tx.objectStore(name)
  const result = await store.getAll()

  await tx.done

  return result
}

export const bulkPut = async (name: string, data: any[]) => {
  await ready

  if (!db) return

  const tx = db.transaction(name, "readwrite")
  const store = tx.objectStore(name)

  await Promise.all(
    data.map(item => {
      try {
        store.put(item)
      } catch (e) {
        console.error(e, item)
      }
    }),
  )

  await tx.done
}

export const bulkDelete = async (name: string, ids: string[]) => {
  await ready

  if (!db) return

  const tx = db.transaction(name, "readwrite")
  const store = tx.objectStore(name)

  await Promise.all(ids.map(id => store.delete(id)))
  await tx.done
}

export const initStorage = async (
  name: string,
  version: number,
  adapters: Record<string, StorageAdapter>,
) => {
  if (!window.indexedDB) {
    console.warn("IndexedDB not available, running without persistence")
    ready.resolve()
    return
  }

  window.addEventListener("beforeunload", () => closeStorage())

  if (db) {
    throw new Error("Db initialized multiple times")
  }

  try {
    db = await openDB(name, version, {
      upgrade(db: IDBPDatabase) {
        const names = Object.keys(adapters)

        for (const name of db.objectStoreNames) {
          if (!names.includes(name)) {
            db.deleteObjectStore(name)
          }
        }

        for (const [name, {keyPath}] of Object.entries(adapters)) {
          try {
            db.createObjectStore(name, {keyPath})
          } catch (e) {
            console.warn(e)
          }
        }
      },
    })

    ready.resolve()

    await Promise.all(
      Object.values(adapters).map(async adapter => {
        await adapter.init()

        unsubscribers.push(adapter.sync())
      }),
    )
  } catch (e) {
    console.error("Failed to initialize IndexedDB:", e)
    ready.resolve()
  }
}

export const closeStorage = async () => {
  dead.set(true)
  unsubscribers.forEach(call)
  await db?.close()
}

export const clearStorage = async () => {
  if (db) {
    await closeStorage()
    await deleteDB(db.name)
    db = undefined // force initStorage to run again in tests
  }
}

export type RelaysStorageAdapterOptions = {
  name: string
}

export class RelaysStorageAdapter {
  keyPath = "url"

  constructor(readonly options: RelaysStorageAdapterOptions) {}

  async init() {
    relays.set(await getAll(this.options.name))
  }

  sync() {
    return throttled(3000, relays).subscribe($relays => bulkPut(this.options.name, $relays))
  }
}

export type HandlesStorageAdapterOptions = {
  name: string
}

export class HandlesStorageAdapter {
  keyPath = "nip05"

  constructor(readonly options: HandlesStorageAdapterOptions) {}

  async init() {
    handles.set(await getAll(this.options.name))
  }

  sync() {
    return onHandle(batch(300, $handles => bulkPut(this.options.name, $handles)))
  }
}

export type ZappersStorageAdapterOptions = {
  name: string
}

export class ZappersStorageAdapter {
  keyPath = "lnurl"

  constructor(readonly options: ZappersStorageAdapterOptions) {}

  async init() {
    zappers.set(await getAll(this.options.name))
  }

  sync() {
    return onZapper(batch(300, $zappers => bulkPut(this.options.name, $zappers)))
  }
}

export type FreshnessStorageAdapterOptions = {
  name: string
}

export class FreshnessStorageAdapter {
  keyPath = "key"

  constructor(readonly options: FreshnessStorageAdapterOptions) {}

  async init() {
    const items = await getAll(this.options.name)

    freshness.set(fromPairs(items.map(item => [item.key, item.value])))
  }

  sync() {
    const interval = setInterval(() => {
      bulkPut(
        this.options.name,
        Object.entries(freshness.get()).map(([key, value]) => ({key, value})),
      )
    }, 10_000)

    return () => clearInterval(interval)
  }
}

export type PlaintextStorageAdapterOptions = {
  name: string
}

export class PlaintextStorageAdapter {
  keyPath = "key"

  constructor(readonly options: PlaintextStorageAdapterOptions) {}

  async init() {
    const items = await getAll(this.options.name)

    plaintext.set(fromPairs(items.map(item => [item.key, item.value])))
  }

  sync() {
    const interval = setInterval(() => {
      bulkPut(
        this.options.name,
        Object.entries(plaintext.get()).map(([key, value]) => ({key, value})),
      )
    }, 10_000)

    return () => clearInterval(interval)
  }
}

export type TrackerStorageAdapterOptions = {
  name: string
  tracker: Tracker
}

export class TrackerStorageAdapter {
  keyPath = "id"

  constructor(readonly options: TrackerStorageAdapterOptions) {}

  async init() {
    const relaysById = new Map<string, Set<string>>()

    for (const {id, relays} of await getAll(this.options.name)) {
      relaysById.set(id, new Set(relays))
    }

    this.options.tracker.load(relaysById)
  }

  sync() {
    const updateOne = (id: string, relay: string) =>
      bulkPut(this.options.name, [{id, relays: Array.from(this.options.tracker.getRelays(id))}])

    const updateAll = () =>
      bulkPut(
        this.options.name,
        Array.from(this.options.tracker.relaysById.entries()).map(([id, relays]) => ({
          id,
          relays: Array.from(relays),
        })),
      )

    this.options.tracker.on("add", updateOne)
    this.options.tracker.on("remove", updateOne)
    this.options.tracker.on("load", updateAll)
    this.options.tracker.on("clear", updateAll)

    return () => {
      this.options.tracker.off("add", updateOne)
      this.options.tracker.off("remove", updateOne)
      this.options.tracker.off("load", updateAll)
      this.options.tracker.off("clear", updateAll)
    }
  }
}

export type EventsStorageAdapterOptions = {
  name: string
  limit: number
  repository: Repository
  rankEvent: (event: TrustedEvent) => number
}

export class EventsStorageAdapter {
  keyPath = "id"
  eventCount = 0

  constructor(readonly options: EventsStorageAdapterOptions) {}

  async init() {
    const events = await getAll(this.options.name)

    this.eventCount = events.length

    this.options.repository.load(events)
  }

  sync() {
    const {name, limit, rankEvent} = this.options

    const onUpdate = async ({added, removed}: RepositoryUpdate) => {
      // Only add events we want to keep
      const keep = added.filter(e => rankEvent(e) > 0)

      // Add new events
      if (keep.length > 0) {
        await bulkPut(name, keep)
      }

      // If we're well above our retention limit, drop lowest-ranked events
      if (this.eventCount > limit * 1.5) {
        removed = new Set(removed)

        for (const event of sortBy(e => -rankEvent(e), await getAll(name)).slice(limit)) {
          removed.add(event.id)
        }
      }

      if (removed.size > 0) {
        await bulkDelete(name, Array.from(removed))
      }

      // Keep track of our total number of events. This isn't strictly accurate, but it's close enough
      this.eventCount = this.eventCount + keep.length - removed.size
    }

    this.options.repository.on("update", onUpdate)

    return () => this.options.repository.off("update", onUpdate)
  }
}
