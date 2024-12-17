import {fromPairs, last, first} from "@welshman/lib"
import {getAddress, getTags, getTagValues} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {SearchHelper, parseJson} from "src/util/misc"

export type Handler = {
  kind: number
  name: string
  about: string
  image: string
  identifier: string
  event: TrustedEvent
  website?: string
  lud16?: string
  nip05?: string
}

export const readHandlers = (event: TrustedEvent) => {
  const {d: identifier} = fromPairs(event.tags)
  const meta = parseJson(event.content)
  const normalizedMeta = {
    name: meta?.name || meta?.display_name || "",
    image: meta?.image || meta?.picture || "",
    about: meta?.about || "",
    website: meta?.website || "",
    lud16: meta?.lud16 || "",
    nip05: meta?.nip05 || "",
  }

  // If our meta is missing important stuff, don't bother showing it
  if (!normalizedMeta.name || !normalizedMeta.image) {
    return []
  }

  return getTagValues("k", event.tags).map(kind => ({
    ...normalizedMeta,
    kind: parseInt(kind),
    identifier,
    event,
  })) as Handler[]
}

export const getHandlerKey = (handler?: Handler) => `${handler.kind}:${getAddress(handler.event)}`

export const displayHandler = (handler?: Handler) => handler?.name || "[no name]"

export class HandlerSearch extends SearchHelper<Handler, string> {
  config = {keys: ["name", "about"]}
  getValue = (option: Handler) => getAddress(option.event)
  displayValue = (address: string) => displayHandler(this.getOption(address))
}

export const getHandlerAddress = (event: TrustedEvent) => {
  const tags = getTags("a", event.tags)
  const tag = tags.find(t => last(t) === "web") || first(tags)

  return tag?.[1]
}
