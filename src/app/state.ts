import type {ComponentType} from 'svelte'
import {readable, writable} from 'svelte/store'
import type {FlyParams} from 'svelte/transition'
import {fly as baseFly} from 'svelte/transition'
import {randomId} from '@welshman/lib'
import {pushState} from '$app/navigation'

// Animations

export const fly = (node: Element, params?: FlyParams | undefined) => baseFly(node, {y: 20, ...params})

// Toast

export type Toast = {
  id: number
  message: string
  options: ToastOptions
}

export type ToastOptions = {
  timeout?: number
}

export const toast = writable<Toast | null>(null)

export const pushToast = ({message = "", id = Math.random()}: Partial<Toast>, options: ToastOptions) => {
  toast.set({id, message, options})

  setTimeout(() => popToast(id), options.timeout || 5000)

  return id
}

export const popToast = (id: number) => toast.update($t => $t?.id === id ? null : $t)

// Modals

export const modals = new Map()

export const pushModal = (component: ComponentType, props: Record<string, any>) => {
  const id = randomId()

  // TODO: fix memory leak here by listening to history somehow
  modals.set(id, {component, props})
  pushState('', {modal: id})

  return id
}

export const popModal = (id: string) => {
  modals.delete(id)
  history.back()
}

// App state

export const spaces = readable([
  {
    id: 'test',
    name: "Test",
    picture: "https://images.unsplash.com/photo-1721853046219-209921be684e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0fHx8ZW58MHx8fHx8"
  }
])
