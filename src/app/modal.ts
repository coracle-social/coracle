import type {ComponentType} from "svelte"
import {readable, writable} from "svelte/store"
import {randomId} from "@welshman/lib"
import {pushState} from "$app/navigation"

export const modals = new Map()

export const pushModal = (component: ComponentType, props: Record<string, any>) => {
  const id = randomId()

  // TODO: fix memory leak here by listening to history somehow
  modals.set(id, {component, props})
  pushState("", {modal: id})

  return id
}

export const popModal = (id: string) => {
  modals.delete(id)
  history.back()
}
