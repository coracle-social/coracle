import lf from 'localforage'
import memoryStorageDriver from 'localforage-memoryStorageDriver'
import {switcherFn} from 'hurdak/lib/hurdak'
import {error, warn} from 'src/util/logger'
import {where} from 'src/util/misc'

// Firefox private mode doesn't have access to any storage options
lf.defineDriver(memoryStorageDriver)
lf.setDriver([lf.INDEXEDDB, lf.WEBSQL, lf.LOCALSTORAGE, 'memoryStorageDriver'])

const stores = {}

const getStore = storeName => {
  if (!stores[storeName]) {
    stores[storeName] = lf.createInstance({name: 'coracle', storeName})
  }

  if (stores[storeName].dropped) {
    warn(`Dropped instance ${storeName} was requested`)

    return null
  }

  return stores[storeName]
}

addEventListener('message', async ({data: {topic, payload, channel}}) => {
  const reply = (topic, payload) => postMessage({channel, topic, payload})

  switcherFn(topic, {
    'localforage.call': async () => {
      const {storeName, method, args} = payload
      const instance = getStore(storeName)

      if (instance) {
        const result = await switcherFn(method, {
          dump: () => new Promise(resolve => {
            const result = {}

            instance.iterate(
              (v, k, i) => { result[k] = v },
              () => resolve(result),
            )
          }),
          setItems: async () => {
            for (const [k, v] of Object.entries(args[0])) {
              await instance.setItem(k, v)
            }
          },
          removeItems: async () => {
            for (const k of args[0]) {
              await instance.removeItem(k)
            }
          },
          drop: async () => {
            instance.dropped = true
            await instance.drop()
          },
          default: () => instance[method](...args),
        })

        reply('localforage.return', result)
      }
    },
    'localforage.iterate': async () => {
      const matchesFilter = where(payload.where)
      const instance = getStore(payload.storeName)

      if (instance) {
        instance.iterate(
          (v, k, i) => {
            if (matchesFilter(v)) {
              reply('localforage.item', {v, k, i})
            }
          },
          () => {
            reply('localforage.iterationComplete')
          },
        )
      }
    },
    default: () => {
      throw new Error(`invalid topic: ${topic}`)
    },
  })
})

addEventListener('error', error)
addEventListener('unhandledrejection', error)
