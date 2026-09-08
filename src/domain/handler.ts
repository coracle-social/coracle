import {HANDLER_INFORMATION, getAddress} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {Handler as HandlerKind, HandlerRecommendation} from "@welshman/domain"
import type {HandlerMeta} from "@welshman/domain"
import {reader} from "src/engine/core"
import {SearchHelper} from "src/util/misc"

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

export const readHandlers = (event: TrustedEvent): Handler[] => {
  if (event?.kind !== HANDLER_INFORMATION) {
    return []
  }

  const handler = reader(HandlerKind)(event)

  const {display_name, image} = handler.values as HandlerMeta & {
    display_name?: string
    image?: string
  }

  const normalizedMeta = {
    name: handler.name() || display_name || "",
    image: image || handler.picture() || "",
    about: handler.about() || "",
    website: handler.website() || "",
    lud16: handler.lud16() || "",
    nip05: handler.nip05() || "",
  }

  // If our meta is missing important stuff, don't bother showing it
  if (!normalizedMeta.name || !normalizedMeta.image) {
    return []
  }

  return handler.kinds().map(kind => ({
    ...normalizedMeta,
    kind,
    identifier: handler.identifier() || "",
    event,
  }))
}

export const getHandlerKey = (handler: Handler) => `${handler.kind}:${getAddress(handler.event)}`

export const displayHandler = (handler?: Handler) => handler?.name || "[no name]"

export class HandlerSearch extends SearchHelper<Handler, string> {
  config = {keys: ["name", "about"]}
  getValue = (option: Handler) => getAddress(option.event)
  displayValue = (address: string) => displayHandler(this.getOption(address))
}

export const getHandlerAddress = (event: TrustedEvent) =>
  reader(HandlerRecommendation)(event).handlerAddress()
