import prop from "ramda/src/prop"
import {uuid} from "hurdak/lib/hurdak"
import {writable, get} from "svelte/store"

export const store = writable(null)

export default {
  show: (type, message, timeout = 5) => {
    const id = uuid()

    store.set({id, type, message})

    setTimeout(() => {
      if (prop("id", get(store)) === id) {
        store.set(null)
      }
    }, timeout * 1000)
  },
}
