import type {ComponentType} from "svelte"
import {randomId, Emitter} from "@welshman/lib"
import {goto} from "$app/navigation"

export const emitter = new Emitter()

export const modals = new Map()

export type ModalOptions = {
  drawer?: boolean
}

export const pushModal = (component: ComponentType, props: Record<string, any> = {}, options: ModalOptions = {}) => {
  const id = randomId()

  // TODO: fix memory leak here by listening to history somehow
  modals.set(id, {component, props, options})
  goto("#" + id)

  return id
}

export const clearModal = () => {
  goto("#")
  emitter.emit("close")
}
