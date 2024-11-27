import type {ComponentType} from "svelte"
import {writable} from "svelte/store"
import {randomId, always, assoc, Emitter} from "@welshman/lib"
import {goto} from "$app/navigation"

export type ModalOptions = {
  drawer?: boolean
  fullscreen?: boolean
  replaceState?: boolean
  path?: string
}

export type Modal = {
  id: string
  component: ComponentType
  props: Record<string, any>
  options: ModalOptions
}

export const emitter = new Emitter()

export const modals = writable<Record<string, Modal>>({})

export const pushModal = (
  component: ComponentType,
  props: Record<string, any> = {},
  options: ModalOptions = {},
) => {
  const id = randomId()
  const path = options.path || ""

  modals.update(assoc(id, {id, component, props, options}))

  goto(path + "#" + id, {replaceState: options.replaceState})

  return id
}

export const pushDrawer = (
  component: ComponentType,
  props: Record<string, any> = {},
  options: ModalOptions = {},
) => pushModal(component, props, {...options, drawer: true})

export const clearModals = () => {
  modals.update(always({}))
  emitter.emit("close")
}
