import type {TrustedEvent} from "@welshman/util"
import {Label} from "@welshman/domain"
import {reader} from "src/engine/core"
import {makeSearch} from "src/util/misc"

export type Collection = {
  name: string
  ids: string[]
  pubkey: string
  created_at: number
  updated_at: number
}

export const readCollections = (events: TrustedEvent[]) => {
  const collections = new Map<string, Collection>()

  for (const event of events) {
    const label = reader(Label)(event)
    const ids = label.eventIds()

    for (const name of label.labels("#t")) {
      const key = `${event.pubkey}:${name}`
      const collection: Collection = collections.get(key) || {
        name,
        ids: [],
        pubkey: event.pubkey,
        created_at: event.created_at,
        updated_at: event.created_at,
      }

      collections.set(key, {
        ...collection,
        ids: [...collection.ids, ...ids],
        created_at: Math.min(collection.created_at, event.created_at),
        updated_at: Math.min(collection.updated_at, event.created_at),
      })
    }
  }

  return Array.from(collections.values())
}

export const displayCollection = (collection?: {name: string}) => collection?.name || "[no name]"

export const makeCollectionSearch = (collections: Collection[]) =>
  makeSearch<string, Collection>(collections, {
    getValue: ({pubkey, name}: Collection) => `${pubkey}:${name}`,
    fuseOptions: {keys: ["name"]},
    displayValue: (name: string) => displayCollection({name}),
  })
