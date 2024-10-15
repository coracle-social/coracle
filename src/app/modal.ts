import type {ComponentType} from "svelte"
import {randomId, Emitter} from "@welshman/lib"
import {goto} from "$app/navigation"

export const emitter = new Emitter()

export const modals = new Map()

export type ModalOptions = {
  drawer?: boolean
}

export const pushModal = (
  component: ComponentType,
  props: Record<string, any> = {},
  options: ModalOptions = {},
) => {
  const id = randomId()

  modals.set(id, {component, props, options})

  goto("#" + id)

  return id
}

export const pushDrawer = (
  component: ComponentType,
  props: Record<string, any> = {},
  options: ModalOptions = {},
) => pushModal(component, props, {...options, drawer: true})

export const clearModal = () => {
  goto("#")
  modals.clear()
  emitter.emit("close")
}
