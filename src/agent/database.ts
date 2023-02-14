import {debounce} from 'throttle-debounce'
import {filter, always, is, prop, find, without, pluck, all, identity} from 'ramda'
import {writable, derived} from 'svelte/store'
import {switcherFn, createMap, ensurePlural} from 'hurdak/lib/hurdak'
import {log, error} from 'src/util/logger'
import {defer, where, now, timedelta, asyncIterableToArray} from 'src/util/misc'

// Types

type Message = {
  topic: string
  payload: object
}

type Table = {
  name: string
  subscribe: (subscription: (value: any) => void) => (() => void)
  put: (data: object) => void
  patch: (data: object) => void
  bulkPut: (data: object) => void
  bulkPatch: (data: object) => void
  iter: (spec?: object) => Promise<Array<Record<string, any>>>
  all: (spec?: object) => Array<Record<string, any>>
  get: (key: string) => Record<string, any>
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

const callLocalforage = async (storeName, method, ...args) => {
  const message = await call('localforage.call', {storeName, method, args})

  if (message.topic !== 'localforage.return') {
    throw new Error(`callLocalforage received invalid response: ${message}`)
  }

  return message.payload
}


// Methods that proxy localforage

const getItem = (storeName, ...args) => callLocalforage(storeName, 'getItem', ...args)
const setItem = (storeName, ...args) => callLocalforage(storeName, 'setItem', ...args)
const setItems = (storeName, ...args) => callLocalforage(storeName, 'setItems', ...args)
const removeItem = (storeName, ...args) => callLocalforage(storeName, 'removeItem', ...args)
const removeItems = (storeName, ...args) => callLocalforage(storeName, 'removeItems', ...args)

const length = storeName => callLocalforage(storeName, 'length')
const clear = storeName => callLocalforage(storeName, 'clear')
const keys = storeName => callLocalforage(storeName, 'keys')
const dump = storeName => callLocalforage(storeName, 'dump')

const iterate = (storeName, where = {}) => ({
  [Symbol.asyncIterator]() {
    let done = false
    let promise = defer()
    const messages = []
    const channel = new Channel({
      onMessage: m => switcherFn(m.topic, {
        'localforage.item': () => {
          promise.resolve()
          messages.push(m.payload)
        },
        'localforage.iterationComplete': () => {
          done = true
          promise.resolve()
          channel.close()
        },
        default: () => {
          throw new Error(`Invalid topic ${m.topic}`)
        },
      }),
    })

    channel.send('localforage.iterate', {storeName, where})

    const next = async () => {
      if (done) {
        return {done}
      }

      const [value] = messages.splice(0, 1)

      if (value) {
        return {done, value}
      } else {
        promise = defer()

        await promise

        return next()
      }
    }

    return {next}
  }
})

// Local copy of data so we can provide a sync observable interface. The worker
// is just for storing data and processing expensive queries

const registry = {}

type TableOpts = {
  isValid?: (x: any) => boolean
  resetOnInit?: boolean
}

const defineTable = (name: string, pk: string, opts: TableOpts = {}): Table => {
  const {isValid = always(true), resetOnInit = false} = opts
  let p = Promise.resolve()
  let listeners = []
  let data = {}

  const ready = writable(false)

  const subscribe = f => {
    listeners.push(f)

    f(data)

    return () => {
      listeners = without([f], listeners)
    }
  }

  const setAndNotify = newData => {
    // Update our local copy
    data = newData

    // Notify subscribers
    for (const f of listeners) {
      f(data)
    }
  }

  const bulkPut = (newData: Record<string, object>): void => {
    if (is(Array, newData)) {
      throw new Error(`Updates must be an object, not an array`)
    }

    newData = filter(isValid, newData)
    setAndNotify({...data, ...newData})

    // Sync to storage, keeping updates in order
    p = p.then(() => setItems(name, newData)) as Promise<void>
  }

  const bulkPatch = (updates: Record<string, object>): void => {
    if (is(Array, updates)) {
      throw new Error(`Updates must be an object, not an array`)
    }

    const newData = {}
    for (const [k, v] of Object.entries(updates)) {
      newData[k] = {...data[k], ...v}
    }

    bulkPut(newData)
  }

  const put = item => bulkPut(createMap(pk, [item]))
  const patch = item => bulkPatch(createMap(pk, [item]))

  const toArray = () => Object.values(data)
  const iter = (spec = {}) => asyncIterableToArray(iterate(name, spec), prop('v'))
  const all = (spec = {}) => toArray().filter(where(spec))
  const one = (spec = {}) => find(where(spec), toArray())
  const get = k => data[k]

  // Sync from storage initially
  ;(async () => {
    const t = Date.now()
    const initialData = filter(isValid, await dump(name))

    if (resetOnInit) {
      await clear(name)
      await bulkPut(initialData)
    } else {
      setAndNotify(initialData)
    }

    const recordsCount = Object.keys(initialData).length

    log(`Table ${name} ready in ${Date.now() - t}ms (${recordsCount} records)`)

    ready.set(true)
  })()

  registry[name] = {
    name, subscribe, bulkPut, bulkPatch, put, patch, toArray, iter, all, one, get,
    ready,
  }

  return registry[name]
}

const people = defineTable('people', 'pubkey')
const rooms = defineTable('rooms', 'id')
const messages = defineTable('messages', 'id')
const alerts = defineTable('alerts', 'id')
const relays = defineTable('relays', 'url')
const routes = defineTable('routes', 'id', {
  resetOnInit: true,
  isValid: route =>
    route.last_seen > now() - timedelta(7, 'days'),
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

const clearAll = () => Promise.all(Object.keys(registry).map(clear))

const ready = derived(pluck('ready', Object.values(registry)), all(identity))

export default {
  getItem, setItem, setItems, removeItem, removeItems, length, clear, keys,
  dump, iterate, watch, getPersonWithFallback, clearAll, people, rooms, messages,
  alerts, relays, routes, ready,
}
