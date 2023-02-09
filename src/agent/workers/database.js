import lf from 'localforage'
import memoryStorageDriver from 'localforage-memoryStorageDriver'
import {switcherFn} from 'hurdak/lib/hurdak'
import {where} from 'src/util/misc'

// Firefox private mode doesn't have access to any storage options
lf.defineDriver(memoryStorageDriver)
lf.setDriver([lf.INDEXEDDB, lf.WEBSQL, lf.LOCALSTORAGE, 'memoryStorageDriver'])

const stores = {}

const getStore = storeName => {
  if (!stores[storeName]) {
    stores[storeName] = lf.createInstance({name: 'coracle', storeName})
  }

  return stores[storeName]
}

addEventListener('message', async ({data: {topic, payload, channel}}) => {
  const reply = (topic, payload) => postMessage({channel, topic, payload})

  switcherFn(topic, {
    'localforage.call': async () => {
      const {storeName, method, args} = payload
      const result = await getStore(storeName)[method](...args)

      reply('localforage.return', result)
    },
    'localforage.iterate': async () => {
      const matchesFilter = where(payload.where)

      getStore(payload.storeName).iterate(
        (v, k, i) => {
          if (matchesFilter(v)) {
            reply('localforage.item', {v, k, i})
          }
        },
        () => {
          reply('localforage.iterationComplete')
        },
      )
    },
    default: () => {
      throw new Error(`invalid topic: ${topic}`)
    },
  })
})

addEventListener('error', event => {
  console.error(event.error)
})

addEventListener('unhandledrejection', event => {
  console.error(event)
})
