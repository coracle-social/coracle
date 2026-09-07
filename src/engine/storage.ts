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
  // The connection once it's resolved, so a write issued while the page is being torn down can
  // open its transaction in the same task instead of a microtask later
  resolved: Maybe<IDBPDatabase>
  failedToConnect = false
  closed = false

  constructor(readonly options: IDBOptions) {}

  // Object stores can only be created during a version change, and which stores we need depends on
  // the app version, so open at whatever version exists and bump it to reconcile the schema. That
  // way adding a store never requires remembering to bump a hard-coded version number.
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

  // Drop the connection, letting the next read or write re-open it. This is what another tab's
  // schema upgrade needs, so it deliberately doesn't retire the database.
  close = async () => {
    const connection = this.connection

    this.connection = undefined
    this.resolved = undefined

    await connection?.then(c => c?.close())
  }

  // Close for good, so a write that was already in flight when the app was torn down can't
  // silently re-open a database belonging to an account we've switched away from.
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

// How many events we're willing to keep on disk
const EVENT_LIMIT = 10_000

// How long to accumulate changes before writing them
const FLUSH_INTERVAL = 3000

// Kinds that are worth caching for people the user follows, since they're needed to render
// anything that mentions them
const META_KINDS = [PROFILE, FOLLOWS, MUTES, RELAYS, MESSAGING_RELAYS]

// Relays we talk to no matter who's logged in, whose metadata is worth having up front
const INITIAL_RELAYS = [
  ...env.DEFAULT_RELAYS,
  ...env.DVM_RELAYS,
  ...env.INDEXER_RELAYS,
  ...env.SEARCH_RELAYS,
]

// An event together with where it came from, so the tracker can be restored along with the
// repository rather than kept in a second table that nothing ever prunes.
type EventItem = {
  id: string
  event: TrustedEvent
  relays: string[]
}

type PlaintextItem = {
  key: string
  value: string
}

// Every account gets its own database, since an app's caches only make sense for the identity
// they were built for. Signed-out users get one too — they can browse, and relay metadata is
// worth keeping across visits.
export const getDatabaseName = (pubkey?: string) => `coracle-${pubkey || "anonymous"}`

const onWriteError = (e: unknown) => console.error("Failed to write to storage", e)

/**
 * Caches an app's repository, tracker and local collections in indexeddb. Everything in here
 * belongs to a single identity, so each gets its own database named for its pubkey, and the
 * policy below builds and tears one down along with the app.
 */
export class Storage {
  ready: Promise<void>

  private db: IDB
  private eventCount = 0
  private unsubscribers: Unsubscriber[] = []
  private timeouts: ReturnType<typeof setTimeout>[] = []
  private stopped = false
  private destroyed: Maybe<Promise<void>>

  // Ids waiting to be written or deleted. Both the repository and the tracker feed this one
  // buffer, so a flush drains everything at once and the two can't write the same row twice.
  private pendingWrites = new Set<string>()
  private pendingDeletes = new Set<string>()
  private flushTimeout: Maybe<ReturnType<typeof setTimeout>>
  private pruning = false

  // Drains for the collections that buffer their own writes, so one flush covers all of them
  private flushers: (() => void)[] = []

  constructor(private readonly app: IApp) {
    this.db = new IDB({name: getDatabaseName(app.user?.pubkey), stores: TABLES})
    this.ready = this.start().catch(e => console.error("Failed to initialize storage", e))
  }

  cleanup = () => {
    // Get anything buffered onto disk before the connection goes away, so switching accounts
    // doesn't discard the outgoing account's last few seconds. Closing a database waits for
    // transactions that have already been opened, so this write survives the destroy below.
    this.flush()

    this.stopped = true
    this.timeouts.forEach(clearTimeout)
    this.unsubscribers.forEach(call)
    this.destroyed = this.db.destroy()
  }

  clear = async () => {
    this.cleanup()

    // Deleting is blocked until the connection this just closed is actually gone
    await this.destroyed
    await this.db.clear()
  }

  private start = async () => {
    await this.db.connect()

    // The feed can't render without events, and relay metadata decides where we'd load them from,
    // so those two gate the first paint and everything else follows it.
    const [, unsubscribeRelays] = await Promise.all([this.loadEvents(), this.initRelays()])

    this.addUnsubscriber(this.syncEvents())
    this.addUnsubscriber(this.syncTracker())
    this.addUnsubscriber(unsubscribeRelays)

    this.defer(this.initHandles)
    this.defer(this.initZappers)
    this.defer(this.initPlaintext)
    this.defer(this.initWraps)

    // Refresh metadata for the relays we always use, now that whatever we had cached is loaded
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

  /**
   * How much we care about keeping an event around: anything belonging to or mentioning one of
   * the user's accounts, plus metadata for people they follow. Both snapshots are read once per
   * pass rather than per event, since a pass can rank the entire cache.
   */
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
    // Ignore rows written in a shape we no longer understand rather than failing to start
    const items = (await table.getAll()).filter(item => item.event)
    const stale: string[] = []

    for (const item of items) {
      // Skip re-verifying signatures we already checked before writing the event to disk
      item.event[verifiedSymbol] = true
    }

    this.app.repository.load(items.map(item => item.event))

    const relaysById = new Map<string, Set<string>>()

    for (const {id, relays} of items) {
      // Anything the repository dropped was superseded by a newer version of the same
      // replaceable, so its row is dead weight
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
    // Provenance changes rewrite the event's row, so they queue the same way an event does. The
    // row is built at flush time, which is also how a brand-new event — tracked before it's
    // published, and so not yet in the repository — ends up stored with its relays.
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

  /**
   * Write everything that's queued. Every buffer is drained synchronously and its transaction is
   * opened before this returns, so it can be called while the page is going away — see the
   * pagehide/visibilitychange listeners in the policy below.
   */
  flush = () => {
    this.flushEvents()
    this.flushers.forEach(call)
  }

  /**
   * A write buffer the shared flush can drain on demand, which is the one thing `batch` from the
   * library can't do — it only ever fires on its own timer.
   */
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

      // Only keep events we care about, and skip anything that left the repository while it was
      // sitting in the buffer
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

    // Keep track of our total number of events. This isn't strictly accurate — an update to an
    // event we already have counts twice — but it's close enough to decide when to prune.
    this.eventCount = this.eventCount + items.length - deletes.length

    void this.prune(rankEvent)
  }

  // If we're well above our retention limit, drop the lowest-ranked events. This reads the whole
  // table, so it's deliberately left out of the synchronous part of a flush.
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
      // Validation is meaningless without these, and rows cached before they were required
      // won't have them
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

// The current app's cache. There's exactly one, and it's replaced when the app is.
export const storage = withGetter(writable<Maybe<Storage>>(undefined))

// Whether the current app's cache has finished hydrating the repository. The UI waits on this
// before its first render so it doesn't paint an empty feed and then swap it out. Subscribing
// builds the app if nothing else has yet, so this can't deadlock waiting for a cache that was
// never constructed.
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

// Storage is scoped to one app's repository, tracker and caches, so it's built and torn down
// with the app rather than living on as a module-level singleton.
export const storagePolicy: AppPolicy = $app => {
  const $storage = new Storage($app)
  const unsubscribers: Unsubscriber[] = []

  storage.set($storage)

  // Writes are buffered, so they need a last call before the page goes away. Mobile browsers
  // routinely discard a backgrounded tab without ever firing beforeunload or unload, and coracle
  // ships to mobile, so hidden and pagehide are the only two points worth listening to.
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

/**
 * Delete every account's cache. Used by logout, which drops all sessions and reloads the page,
 * so leaving the other accounts' databases behind would only orphan them.
 */
export const clearStorage = async () => {
  // Clear the current app's cache through its own storage, so it stops writing before the
  // database goes away rather than re-creating it with a queued flush
  await storage.get()?.clear()

  const names = new Set([getDatabaseName(), ...Object.keys(sessions.get()).map(getDatabaseName)])

  await Promise.all(Array.from(names).map(name => deleteDB(name)))
}

// Every identity used to share one database. Nothing migrates out of it, so drop it rather than
// leave a dead copy of the old cache on disk.
if (typeof indexedDB !== "undefined") {
  void deleteDB("coracle")
}

// Importing this module registers the policy, which has to happen before the first app is built
appPolicies.push(storagePolicy)
