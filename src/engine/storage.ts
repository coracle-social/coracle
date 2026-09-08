import {openDB, deleteDB} from "idb"
import type {IDBPDatabase} from "idb"
import {derived, writable} from "svelte/store"
import type {Readable, Unsubscriber} from "svelte/store"
import {call, noop, on, sortBy, spec} from "@welshman/lib"
import type {Maybe} from "@welshman/lib"
import {FOLLOWS, MESSAGING_RELAYS, MUTES, PROFILE, RELAYS, verifiedSymbol} from "@welshman/util"
import type {Handle, TrustedEvent} from "@welshman/util"
import {withGetter} from "@welshman/store"
import type {RepositoryUpdate, WrapItem} from "@welshman/net"
import {Relay, Zapper} from "@welshman/domain"
import type {RelayInfo, ZapperValues} from "@welshman/domain"
import {FollowLists, Handles, Plaintext, Relays, Zappers} from "@welshman/app"
import type {AppPolicy, IApp} from "@welshman/app"
import {app, appPolicies, sessions} from "src/engine/core"
import {env} from "src/engine/env"

// IndexedDB

export type IDBStore = {
  name: string
  keyPath: string
}

export type IDBOptions = {
  name: string
  stores: IDBStore[]
}

export class IDB {
  connection: Maybe<Promise<Maybe<IDBPDatabase>>>
  resolved: Maybe<IDBPDatabase>
  failedToConnect = false
  closed = false

  constructor(readonly options: IDBOptions) {}

  private open = async () => {
    const {name, stores} = this.options
    const blocking = () => this.close()
    const db = await openDB(name, undefined, {blocking})
    const missing = stores.filter(store => !db.objectStoreNames.contains(store.name))
    const obsolete = Array.from(db.objectStoreNames).filter(
      storeName => !stores.some(spec({name: storeName})),
    )

    if (missing.length === 0 && obsolete.length === 0) {
      return db
    }

    // Object stores can only be created during a version change, so bump past whatever
    // version is on disk rather than hard-coding one.
    const version = db.version + 1

    db.close()

    return openDB(name, version, {
      upgrade(idbDb: IDBPDatabase) {
        for (const {name, keyPath} of missing) {
          idbDb.createObjectStore(name, {keyPath})
        }

        for (const storeName of obsolete) {
          idbDb.deleteObjectStore(storeName)
        }
      },
      blocked: (currentVersion, blockedVersion) =>
        console.error(
          `Upgrade of ${name} from ${currentVersion} to ${blockedVersion} is blocked by another connection`,
        ),
      blocking,
    })
  }

  connect = async () => {
    if (this.closed || this.failedToConnect) {
      return undefined
    }

    if (!this.connection) {
      this.connection = this.open()
        .then(connection => (this.resolved = connection))
        .catch(e => {
          console.error("Failed to connect to indexeddb", e)

          this.failedToConnect = true

          return undefined
        })
    }

    return this.connection
  }

  table = <T>(name: string) => new IDBTable<T>(this, name)

  getAll = async <T>(table: string): Promise<T[]> => {
    const connection = this.resolved ?? (await this.connect())

    if (!connection) return []

    const tx = connection.transaction(table, "readonly")
    const store = tx.objectStore(table)
    const result = await store.getAll()

    await tx.done

    return result || []
  }

  bulkPut = async <T>(table: string, data: Iterable<T>) => {
    const connection = this.resolved ?? (await this.connect())

    if (!connection) return

    const tx = connection.transaction(table, "readwrite")
    const store = tx.objectStore(table)

    await Promise.all(
      Array.from(data).map(item => {
        try {
          store.put(item)
        } catch (e) {
          console.error(e, item)
        }
      }),
    )

    await tx.done
  }

  bulkDelete = async (table: string, ids: Iterable<string>) => {
    const connection = this.resolved ?? (await this.connect())

    if (!connection) return

    const tx = connection.transaction(table, "readwrite")
    const store = tx.objectStore(table)

    await Promise.all(Array.from(ids).map(id => store.delete(id)))
    await tx.done
  }

  close = async () => {
    const connection = this.connection

    this.connection = undefined
    this.resolved = undefined

    await connection?.then(c => c?.close())
  }

  destroy = async () => {
    this.closed = true

    await this.close()
  }

  clear = async () => {
    await this.destroy()
    await deleteDB(this.options.name, {
      blocked: currentVersion =>
        console.error(`Deletion of ${this.options.name} at ${currentVersion} is blocked`),
    })
  }
}

export class IDBTable<T> {
  constructor(
    readonly db: IDB,
    readonly name: string,
  ) {}

  getAll = () => this.db.getAll<T>(this.name)

  bulkPut = (data: Iterable<T>) => this.db.bulkPut(this.name, data)

  bulkDelete = (ids: Iterable<string>) => this.db.bulkDelete(this.name, ids)
}

// Storage

const TABLES: IDBStore[] = [
  {name: "events", keyPath: "id"},
  {name: "relays", keyPath: "url"},
  {name: "handles", keyPath: "nip05"},
  {name: "zappers", keyPath: "lnurl"},
  {name: "plaintext", keyPath: "key"},
  {name: "wraps", keyPath: "id"},
]

const EVENT_LIMIT = 10_000

const FLUSH_INTERVAL = 3000

const META_KINDS = [PROFILE, FOLLOWS, MUTES, RELAYS, MESSAGING_RELAYS]

const INITIAL_RELAYS = [
  ...env.DEFAULT_RELAYS,
  ...env.DVM_RELAYS,
  ...env.INDEXER_RELAYS,
  ...env.SEARCH_RELAYS,
]

type EventItem = {
  id: string
  event: TrustedEvent
  relays: string[]
}

type PlaintextItem = {
  key: string
  value: string
}

export const getDatabaseName = (pubkey?: string) => `coracle-${pubkey || "anonymous"}`

const onWriteError = (e: unknown) => console.error("Failed to write to storage", e)

export class Storage {
  ready: Promise<void>

  private db: IDB
  private eventCount = 0
  private unsubscribers: Unsubscriber[] = []
  private timeouts: ReturnType<typeof setTimeout>[] = []
  private stopped = false
  private destroyed: Maybe<Promise<void>>

  private pendingWrites = new Set<string>()
  private pendingDeletes = new Set<string>()
  private flushTimeout: Maybe<ReturnType<typeof setTimeout>>
  private pruning = false

  private flushers: (() => void)[] = []

  constructor(private readonly app: IApp) {
    this.db = new IDB({name: getDatabaseName(app.user?.pubkey), stores: TABLES})
    this.ready = this.start().catch(e => console.error("Failed to initialize storage", e))
  }

  cleanup = () => {
    this.flush()

    this.stopped = true
    this.timeouts.forEach(clearTimeout)
    this.unsubscribers.forEach(call)
    this.destroyed = this.db.destroy()
  }

  clear = async () => {
    this.cleanup()

    await this.destroyed
    await this.db.clear()
  }

  private start = async () => {
    await this.db.connect()

    const [, unsubscribeRelays] = await Promise.all([this.loadEvents(), this.initRelays()])

    this.addUnsubscriber(this.syncEvents())
    this.addUnsubscriber(this.syncTracker())
    this.addUnsubscriber(unsubscribeRelays)

    this.defer(this.initHandles)
    this.defer(this.initZappers)
    this.defer(this.initPlaintext)
    this.defer(this.initWraps)

    for (const url of INITIAL_RELAYS) {
      this.app.use(Relays).load(url).catch(noop)
    }
  }

  private defer = (init: () => Promise<Unsubscriber>) => {
    this.timeouts.push(
      setTimeout(async () => {
        if (!this.stopped) {
          this.addUnsubscriber(await init())
        }
      }, 0),
    )
  }

  private addUnsubscriber = (unsubscriber: Unsubscriber) => {
    if (this.stopped) {
      unsubscriber()
    } else {
      this.unsubscribers.push(unsubscriber)
    }
  }

  private makeRankEvent = () => {
    const $sessions = sessions.get()
    const $pubkey = this.app.user?.pubkey
    const follows = new Set(
      $pubkey ? (this.app.use(FollowLists).get($pubkey)?.pubkeys() ?? []) : [],
    )

    return (event: TrustedEvent) => {
      if ($sessions[event.pubkey]) return 1
      if (event.tags.some(t => $sessions[t[1]])) return 1
      if (META_KINDS.includes(event.kind) && follows.has(event.pubkey)) return 1

      return 0
    }
  }

  private loadEvents = async () => {
    const table = this.db.table<EventItem>("events")
    const items = (await table.getAll()).filter(item => item.event)
    const stale: string[] = []

    for (const item of items) {
      // Skip re-verifying signatures we already checked before writing the event to disk
      item.event[verifiedSymbol] = true
    }

    this.app.repository.load(items.map(item => item.event))

    const relaysById = new Map<string, Set<string>>()

    for (const {id, relays} of items) {
      if (this.app.repository.getEvent(id)) {
        relaysById.set(id, new Set(relays))
      } else {
        stale.push(id)
      }
    }

    this.app.tracker.load(relaysById)

    this.eventCount = items.length - stale.length

    if (stale.length > 0) {
      void table.bulkDelete(stale)
    }
  }

  private syncEvents = () =>
    on(this.app.repository, "update", ({added, removed}: RepositoryUpdate) => {
      for (const event of added) {
        this.pendingDeletes.delete(event.id)
        this.pendingWrites.add(event.id)
      }

      for (const id of removed) {
        this.pendingWrites.delete(id)
        this.pendingDeletes.add(id)
      }

      this.scheduleFlush()
    })

  private syncTracker = () => {
    const onChange = (id: string) => {
      if (!this.pendingDeletes.has(id)) {
        this.pendingWrites.add(id)
        this.scheduleFlush()
      }
    }

    this.app.tracker.on("add", onChange)
    this.app.tracker.on("remove", onChange)

    return () => {
      this.app.tracker.off("add", onChange)
      this.app.tracker.off("remove", onChange)
    }
  }

  private scheduleFlush = () => {
    if (this.flushTimeout === undefined && !this.stopped) {
      this.flushTimeout = setTimeout(this.flush, FLUSH_INTERVAL)
    }
  }

  flush = () => {
    this.flushEvents()
    this.flushers.forEach(call)
  }

  private buffered = <T>(write: (items: T[]) => void) => {
    const items: T[] = []

    let timeout: Maybe<ReturnType<typeof setTimeout>>

    const flush = () => {
      if (timeout !== undefined) {
        clearTimeout(timeout)
        timeout = undefined
      }

      if (items.length > 0) {
        write(items.splice(0))
      }
    }

    this.flushers.push(flush)

    return (item: T) => {
      items.push(item)

      if (timeout === undefined && !this.stopped) {
        timeout = setTimeout(flush, FLUSH_INTERVAL)
      }
    }
  }

  private flushEvents = () => {
    if (this.flushTimeout !== undefined) {
      clearTimeout(this.flushTimeout)
      this.flushTimeout = undefined
    }

    const writes = Array.from(this.pendingWrites)
    const deletes = Array.from(this.pendingDeletes)

    this.pendingWrites.clear()
    this.pendingDeletes.clear()

    if (writes.length === 0 && deletes.length === 0) {
      return
    }

    const table = this.db.table<EventItem>("events")
    const rankEvent = this.makeRankEvent()
    const items: EventItem[] = []

    for (const id of writes) {
      const event = this.app.repository.getEvent(id)

      if (event && rankEvent(event) > 0) {
        items.push({id, event, relays: Array.from(this.app.tracker.getRelays(id))})
      }
    }

    if (items.length > 0) {
      table.bulkPut(items).catch(onWriteError)
    }

    if (deletes.length > 0) {
      table.bulkDelete(deletes).catch(onWriteError)
    }

    this.eventCount = this.eventCount + items.length - deletes.length

    void this.prune(rankEvent)
  }

  private prune = async (rankEvent: (event: TrustedEvent) => number) => {
    if (this.pruning || this.eventCount <= EVENT_LIMIT * 1.5) {
      return
    }

    this.pruning = true

    try {
      const table = this.db.table<EventItem>("events")
      const items = (await table.getAll()).filter(item => item.event)
      const drop = sortBy(item => -rankEvent(item.event), items)
        .slice(EVENT_LIMIT)
        .map(item => item.id)

      if (drop.length > 0) {
        await table.bulkDelete(drop)

        this.eventCount = this.eventCount - drop.length
      }
    } catch (e) {
      onWriteError(e)
    } finally {
      this.pruning = false
    }
  }

  private initRelays = async () => {
    const table = this.db.table<RelayInfo & {url: string}>("relays")

    for (const row of await table.getAll()) {
      this.app.use(Relays).set(row.url, new Relay(row.url, row))
    }

    const enqueue = this.buffered((relays: Relay[]) =>
      table.bulkPut(relays.map(relay => ({...relay}))).catch(onWriteError),
    )

    return this.app.use(Relays).onItem((_url, relay) => {
      if (relay) enqueue(relay)
    })
  }

  private initHandles = async () => {
    const table = this.db.table<Handle>("handles")

    for (const row of await table.getAll()) {
      this.app.use(Handles).set(row.nip05, row)
    }

    const enqueue = this.buffered((handles: Handle[]) => table.bulkPut(handles).catch(onWriteError))

    return this.app.use(Handles).onItem((_nip05, handle) => {
      if (handle) enqueue(handle)
    })
  }

  private initZappers = async () => {
    const table = this.db.table<ZapperValues>("zappers")

    for (const row of await table.getAll()) {
      if (row.pubkey && row.nostrPubkey) {
        this.app.use(Zappers).set(row.lnurl, new Zapper(row))
      }
    }

    const enqueue = this.buffered((zappers: Zapper[]) =>
      table.bulkPut(zappers.map(zapper => ({...zapper}))).catch(onWriteError),
    )

    return this.app.use(Zappers).onItem((_lnurl, zapper) => {
      if (zapper) enqueue(zapper)
    })
  }

  private initPlaintext = async () => {
    const table = this.db.table<PlaintextItem>("plaintext")

    for (const {key, value} of await table.getAll()) {
      this.app.use(Plaintext).set(key, value)
    }

    const enqueue = this.buffered((entries: PlaintextItem[]) =>
      table.bulkPut(entries).catch(onWriteError),
    )

    return this.app.use(Plaintext).onItem((key, value) => {
      if (value) enqueue({key, value})
    })
  }

  private initWraps = async () => {
    const table = this.db.table<WrapItem>("wraps")

    this.app.wrapManager.load(await table.getAll())

    const onAdd = this.buffered((wrapItems: WrapItem[]) =>
      table.bulkPut(wrapItems).catch(onWriteError),
    )

    const onRemove = this.buffered((wrapItems: WrapItem[]) =>
      table.bulkDelete(wrapItems.map(wrapItem => wrapItem.id)).catch(onWriteError),
    )

    this.app.wrapManager.on("add", onAdd)
    this.app.wrapManager.on("remove", onRemove)

    return () => {
      this.app.wrapManager.off("add", onAdd)
      this.app.wrapManager.off("remove", onRemove)
    }
  }
}

export const storage = withGetter(writable<Maybe<Storage>>(undefined))

export const storageReady: Readable<boolean> = derived(
  [app, storage],
  ([_$app, $storage], set: (ready: boolean) => void) => {
    let cancelled = false

    set(false)

    $storage?.ready.then(() => {
      if (!cancelled) {
        set(true)
      }
    })

    return () => {
      cancelled = true
    }
  },
  false,
)

export const storagePolicy: AppPolicy = $app => {
  const $storage = new Storage($app)
  const unsubscribers: Unsubscriber[] = []

  storage.set($storage)

  if (typeof document !== "undefined") {
    const onPageHide = () => $storage.flush()

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        $storage.flush()
      }
    }

    window.addEventListener("pagehide", onPageHide)
    document.addEventListener("visibilitychange", onVisibilityChange)

    unsubscribers.push(() => {
      window.removeEventListener("pagehide", onPageHide)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    })
  }

  return () => {
    unsubscribers.forEach(call)
    $storage.cleanup()
    storage.set(undefined)
  }
}

export const clearStorage = async () => {
  await storage.get()?.clear()

  const names = new Set([getDatabaseName(), ...Object.keys(sessions.get()).map(getDatabaseName)])

  await Promise.all(Array.from(names).map(name => deleteDB(name)))
}

if (typeof indexedDB !== "undefined") {
  void deleteDB("coracle")
}

appPolicies.push(storagePolicy)
