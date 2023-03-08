import lf from "localforage"
import memoryStorageDriver from "localforage-memoryStorageDriver"
import {switcherFn} from "hurdak/lib/hurdak"
import {error} from "src/util/logger"

// Firefox private mode doesn't have access to any storage options
lf.defineDriver(memoryStorageDriver)
lf.setDriver([lf.INDEXEDDB, lf.WEBSQL, lf.LOCALSTORAGE, "memoryStorageDriver"])

addEventListener("message", async ({data: {topic, payload, channel}}) => {
  const reply = (topic, payload) => postMessage({channel, topic, payload})

  switcherFn(topic, {
    "localforage.call": async () => {
      const {method, args} = payload

      const result = await lf[method](...args)

      reply("localforage.return", result)
    },
    default: () => {
      throw new Error(`invalid topic: ${topic}`)
    },
  })
})

addEventListener("error", error)
addEventListener("unhandledrejection", error)
