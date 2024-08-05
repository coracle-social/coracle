import {readable, writable} from 'svelte/store'
import type {FlyParams} from 'svelte/types'
import {fly as baseFly} from 'svelte/transition'
import {pushState} from '$app/navigation'

// Animations

export const fly = (node: Element, params: FlyParams | undefined) => baseFly(node, {y: 20, ...params})

// Toast

export const toast = writable(null)

// Modals

// TODO: fix memory leak here by listening to history somehow
export const modals = new Map()

export const pushModal = (component, props) => {
  const id = Math.random()

  modals.set(id, {component, props})
  pushState('', {modal: id})

  return id
}

// App state

export const spaces = readable([
  {
    id: 'test',
    name: "Test",
    picture: "https://images.unsplash.com/photo-1721853046219-209921be684e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0fHx8ZW58MHx8fHx8"
  }
])
