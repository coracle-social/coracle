import type {Writable} from 'svelte/store'
import {debounce} from 'throttle-debounce'
import {omit, partition, is, find, without, pluck, all, identity} from 'ramda'
import {writable, derived} from 'svelte/store'
import {createMap, ensurePlural} from 'hurdak/lib/hurdak'
import {log, error} from 'src/util/logger'
import {where, now, timedelta} from 'src/util/misc'

// Types

type Message = {
  topic: string
  payload: object
}

// Plumbing

const worker = new Worker(
  new URL('./workers/database.js', import.meta.url),
  {type: 'module'}
)

worker.addEventListener('error', error)

class Channel {
  id: string
  onMessage: (e: MessageEvent) => void
  constructor({onMessage}) {
    this.id = Math.random().toString().slice(2)
    this.onMessage = e => {
      if (e.data.channel === this.id) {
        onMessage(e.data as Message)
      }
    }

    worker.addEventListener('message', this.onMessage)
  }
  close() {
    worker.removeEventListener('message', this.onMessage)
  }
  send(topic, payload) {
    worker.postMessage({channel: this.id, topic, payload})
  }
}

const call = (topic, payload): Promise<Message> => {
  return new Promise(resolve => {
    const channel = new Channel({
      onMessage: message => {
        resolve(message)
        channel.close()
      },
    })

    channel.send(topic, payload)
  })
}

const callLocalforage = async (method, ...args) => {
  const message = await call('localforage.call', {method, args})

  if (message.topic !== 'localforage.return') {
    throw new Error(`callLocalforage received invalid response: ${message}`)
  }

  return message.payload
}

// Local copy of data so we can provide a sync observable interface. The worker
// is just for storing data and processing expensive queries

const registry = {} as Record<string, Table>

type TableOpts = {
  initialize?: (table: Table) => Promise<object>
}

class Table {
  name: string
  pk: string
  opts: TableOpts
  listeners: Array<(data: Record<string, any>) => void>
  data: Record<string, any>
  ready: Writable<boolean>
  constructor(name, pk, opts: TableOpts = {}) {
    this.name = name
    this.pk = pk
    this.opts = {initialize: t => this.dump(), ...opts}
    this.listeners = []
    this.data = {}
    this.ready = writable(false)

    registry[name] = this

    // Sync from storage initially
    ;(async () => {
      const t = Date.now()

      this._setAndNotify(await this.opts.initialize(this) || {})

      const {length: recordsCount} = Object.keys(this.data)
      const timeElapsed = Date.now() - t

      log(`Table ${name} ready in ${timeElapsed}ms (${recordsCount} records)`)

      this.ready.set(true)
    })()
  }
  _persist = debounce(10_000, () => {
    callLocalforage('setItem', this.name, this.data)
  })
  _setAndNotify(newData) {
    // Update our local copy
    this.data = newData

    // Notify subscribers
    for (const cb of this.listeners) {
      cb(this.data)
    }

    // Save to localstorage
    this._persist()
  }
  subscribe(cb) {
    this.listeners.push(cb)

    cb(this.data)

    return () => {
      this.listeners = without([cb], this.listeners)
    }
  }
  async bulkPut(newData: Record<string, object>): Promise<void> {
    if (is(Array, newData)) {
      throw new Error(`Updates must be an object, not an array`)
    }

    this._setAndNotify({...this.data, ...newData})
  }
  async bulkPatch(updates: Record<string, object>): Promise<void> {
    if (is(Array, updates)) {
      throw new Error(`Updates must be an object, not an array`)
    }

    const newData = {}
    for (const [k, v] of Object.entries(updates)) {
      newData[k] = {...this.data[k], ...v}
    }

    this.bulkPut({...this.data, ...newData})
  }
  async bulkRemove(keys) {
    this._setAndNotify(omit(keys, this.data))
  }
  put(item) {
    return this.bulkPut(createMap(this.pk, [item]))
  }
  patch(item) {
    return this.bulkPatch(createMap(this.pk, [item]))
  }
  remove(k) {
    return this.bulkRemove([k])
  }
  async drop() {
    return callLocalforage('removeItem', this.name)
  }
  async dump() {
    return callLocalforage('getItem', this.name)
  }
  toArray() {
    return Object.values(this.data)
  }
  all(spec = {}) {
    return this.toArray().filter(where(spec))
  }
  one(spec = {}) {
    return find(where(spec), this.toArray())
  }
  get(k) {
    return this.data[k]
  }
}

const people = new Table('people', 'pubkey')
const rooms = new Table('rooms', 'id')
const messages = new Table('messages', 'id')
const alerts = new Table('alerts', 'id')
const relays = new Table('relays', 'url')

const routes = new Table('routes', 'id', {
  initialize: async table => {
    const isValid = r => r.last_seen > now() - timedelta(7, 'days')
    const [valid, invalid] = partition(isValid, Object.values(await table.dump() || {}))

    // Delete stale routes asynchronously
    table.bulkRemove(pluck('id', invalid))

    return valid
  },
})

// Helper to allow us to listen to changes of any given table

const listener = (() => {
  let listeners = []

  for (const table of Object.values(registry) as Array<Table>) {
    table.subscribe(() => listeners.forEach(f => f(table.name)))
  }

  return {
    subscribe: f => {
      listeners.push(f)

      return () => {
        listeners = without([f], listeners)
      }
    },
  }
})()

// Helper to re-run a query every time a given table changes

const watch = (names, f) => {
  names = ensurePlural(names)

  const store = writable(null)
  const tables = names.map(name => registry[name])

  // Initialize synchronously if possible
  const initialValue = f(...tables)
  if (is(Promise, initialValue)) {
    initialValue.then(v => store.set(v))
  } else {
    store.set(initialValue)
  }

  // Debounce refresh so we don't get UI lag
  const refresh = debounce(300, async () => store.set(await f(...tables)))

  // Listen for changes
  listener.subscribe(name => {
    if (names.includes(name)) {
      refresh()
    }
  })

  return store
}

// Other utilities

const getPersonWithFallback = pubkey => people.get(pubkey) || {pubkey}

const dropAll = async () => {
  for (const table of Object.values(registry)) {
    await table.drop()

    log(`Successfully dropped table ${table.name}`)
  }
}

const ready = derived(pluck('ready', Object.values(registry)), all(identity))

const onReady = cb => {
  const unsub = ready.subscribe($ready => {
    if ($ready) {
      cb()
      setTimeout(() => unsub())
    }
  })
}

export default {
  watch, getPersonWithFallback, dropAll, people, rooms, messages,
  alerts, relays, routes, ready, onReady,
}
