import {openDB, deleteDB} from "idb"
import type {IDBPDatabase} from "idb"
import {throttle} from "throttle-debounce"
import {writable} from "svelte/store"
import type {Unsubscriber, Writable} from "svelte/store"
import {randomInt} from "@welshman/lib"
import {withGetter} from "@welshman/store"

export type Item = Record<string, any>

export type IndexedDbAdapter = {
  keyPath: string
  store: Writable<Item[]>
}

export let db: IDBPDatabase

export const dead = withGetter(writable(false))

export const subs: Unsubscriber[] = []

export const DB_NAME = "flotilla"

export const DB_VERSION = 1

export const getAll = async (name: string) => {
  const tx = db.transaction(name, "readwrite")
  const store = tx.objectStore(name)
  const result = await store.getAll()

  await tx.done

  return result
}

export const bulkPut = async (name: string, data: any[]) => {
  const tx = db.transaction(name, "readwrite")
  const store = tx.objectStore(name)

  await Promise.all(data.map(item => store.put(item)))
  await tx.done
}

export const bulkDelete = async (name: string, ids: string[]) => {
  const tx = db.transaction(name, "readwrite")
  const store = tx.objectStore(name)

  await Promise.all(ids.map(id => store.delete(id)))
  await tx.done
}

export const initIndexedDbAdapter = async (name: string, adapter: IndexedDbAdapter) => {
  let copy = await getAll(name)

  adapter.store.set(copy)

  adapter.store.subscribe(
    throttle(randomInt(3000, 5000), async (data: Item[]) => {
      if (dead.get()) {
        return
      }

      const prevIds = new Set(copy.map(item => item[adapter.keyPath]))
      const currentIds = new Set(data.map(item => item[adapter.keyPath]))
      const newRecords = data.filter(r => !prevIds.has(r[adapter.keyPath]))
      const removedRecords = copy.filter(r => !currentIds.has(r[adapter.keyPath]))

      copy = data

      if (newRecords.length > 0) {
        await bulkPut(name, newRecords)
      }

      if (removedRecords.length > 0) {
        await bulkDelete(
          name,
          removedRecords.map(item => item[adapter.keyPath]),
        )
      }
    }),
  )
}

export const initStorage = async (adapters: Record<string, IndexedDbAdapter>) => {
  if (!window.indexedDB) return

  window.addEventListener("beforeunload", () => closeStorage())

  db = await openDB(DB_NAME, DB_VERSION, {
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

  await Promise.all(
    Object.entries(adapters).map(([name, config]) => initIndexedDbAdapter(name, config)),
  )
}

export const closeStorage = async () => {
  dead.set(true)
  subs.forEach(unsub => unsub())
  await db?.close()
}

export const clearStorage = async () => {
  await closeStorage()
  await deleteDB(DB_NAME)
}
