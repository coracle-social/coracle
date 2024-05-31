import {Address} from "@welshman/util"
import {Encryptable} from 'src/domain/util'
import type {DecryptedEvent} from 'src/domain/util'
import {tryJson} from "src/util/misc"

export type SingletonParams = {
  kind: number,
}

export type Singleton = SingletonParams & {
  publicTags: string[][]
  privateTags: string[][]
  event?: DecryptedEvent
}

export type PublishedSingleton = Omit<Singleton, "event"> & {
  event: DecryptedEvent
}

export const makeSingleton = (singleton: SingletonParams): Singleton => ({
  publicTags: [],
  privateTags: [],
  ...singleton,
})

const isValidTag = (tag: string[]) => {
  if (tag[0] === "p") return tag[1]?.length === 64
  if (tag[0] === "e") return tag[1]?.length === 64
  if (tag[0] === "a") return Address.isAddress(tag[1] || "")
  if (tag[0] === "t") return tag[1]?.length > 0

  return true
}

export const readSingleton = (event: DecryptedEvent) => {
  const getTags = tags => Array.isArray(tags) ? tags.filter(isValidTag) : []
  const privateTags = getTags(tryJson(() => JSON.parse(event.plaintext?.content || "")))
  const publicTags = getTags(event.tags)

  return {event, kind: event.kind, publicTags, privateTags} as PublishedSingleton
}

export const createSingleton = ({kind, publicTags = [], privateTags = []}: Singleton) =>
  new Encryptable({kind, tags: publicTags}, {content: JSON.stringify(privateTags)})

export const editSingleton = ({kind, publicTags = [], privateTags = []}: PublishedSingleton) =>
  new Encryptable({kind, tags: publicTags}, {content: JSON.stringify(privateTags)})
