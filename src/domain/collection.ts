import {nth} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {SearchHelper} from "src/util/misc"

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
    for (const name of event.tags.filter(t => t[0] === "l" && t[2] === "#t").map(nth(1))) {
      const key = `${event.pubkey}:${name}`
      const ids = event.tags.filter(t => t[0] === "e").map(nth(1))
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

export class CollectionSearch extends SearchHelper<Collection, string> {
  config = {keys: ["name"]}
  getValue = ({pubkey, name}: Collection) => `${pubkey}:${name}`
  displayValue = (name: string) => displayCollection({name})
}
