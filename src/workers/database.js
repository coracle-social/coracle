import lf from 'localforage'
import memoryStorageDriver from 'localforage-memoryStorageDriver'
import {is, complement, equals, isNil, pipe, prop, identity, allPass} from 'ramda'
import {switcherFn} from 'hurdak/lib/hurdak'

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
      const {storeName, where} = payload
      const matchesFilter = allPass(
        Object.entries(where)
          .map(([key, value]) => {
            let [field, operator = 'eq'] = key.split(':')
            let test, modifier = identity

            if (operator.startsWith('!')) {
              operator = operator.slice(1)
              modifier = complement
            }

            if (operator === 'eq' && is(Array, value)) {
              test = v => value.includes(v)
            } else if (operator === 'eq') {
              test = equals(value)
            } else if (operator === 'lt') {
              test = v => (v || 0) < value
            } else if (operator === 'lte') {
              test = v => (v || 0) <= value
            } else if (operator === 'gt') {
              test = v => (v || 0) > value
            } else if (operator === 'gte') {
              test = v => (v || 0) >= value
            } else if (operator === 'nil') {
              test = isNil
            } else {
              throw new Error(`Invalid operator ${operator}`)
            }

            return pipe(prop(field), modifier(test))
          })
      )

      getStore(storeName).iterate(
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
