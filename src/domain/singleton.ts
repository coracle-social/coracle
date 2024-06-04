import {addToKey} from "@welshman/lib"
import {Address, isShareableRelayUrl} from "@welshman/util"
import {Encryptable} from "src/domain/util"
import type {DecryptedEvent} from "src/domain/util"
import {tryJson} from "src/util/misc"

export type SingletonParams = {
  kind: number
}

export type IndexableSingleton = SingletonParams & {
  publicTags: string[][]
  privateTags: string[][]
  event?: DecryptedEvent
}

export type Singleton = IndexableSingleton & {
  valuesByKey: Record<string, Set<string>>
}

export type PublishedSingleton = Omit<Singleton, "event"> & {
  event: DecryptedEvent
}

export const indexSingleton = (singleton: IndexableSingleton): Singleton => {
  const valuesByKey = {}

  for (const [k, v] of [...singleton.publicTags, ...singleton.privateTags]) {
    if (v) {
      addToKey(valuesByKey, k, v)
    }
  }

  return {...singleton, valuesByKey}
}

export const makeSingleton = (singleton: SingletonParams): Singleton =>
  indexSingleton({publicTags: [], privateTags: [], ...singleton})

const isValidTag = (tag: string[]) => {
  if (tag[0] === "p") return tag[1]?.length === 64
  if (tag[0] === "e") return tag[1]?.length === 64
  if (tag[0] === "a") return Address.isAddress(tag[1] || "")
  if (tag[0] === "t") return tag[1]?.length > 0
  if (tag[0] === "r") return isShareableRelayUrl(tag[1])
  if (tag[0] === "relay") return isShareableRelayUrl(tag[1])

  return true
}

export const readSingleton = (event: DecryptedEvent) => {
  const getTags = tags => (Array.isArray(tags) ? tags.filter(isValidTag) : [])
  const privateTags = getTags(tryJson(() => JSON.parse(event.plaintext?.content || "")))
  const publicTags = getTags(event.tags)

  return indexSingleton({event, kind: event.kind, publicTags, privateTags}) as PublishedSingleton
}

export const createSingleton = ({kind, publicTags = [], privateTags = []}: Singleton) =>
  new Encryptable({kind, tags: publicTags}, {content: JSON.stringify(privateTags)})

export const editSingleton = ({kind, publicTags = [], privateTags = []}: PublishedSingleton) =>
  new Encryptable({kind, tags: publicTags}, {content: JSON.stringify(privateTags)})

export const getSingletonValues = (
  tagName: string,
  singleton: Singleton | undefined,
): Set<string> => singleton?.valuesByKey?.[tagName] || new Set<string>()
