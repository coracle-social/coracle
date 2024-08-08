import {writable} from "svelte/store"
import {randomId} from "@welshman/lib"
import {copyToClipboard} from '@lib/html'

export type Toast = {
  id: string
  message: string
  options: ToastOptions
}

export type ToastOptions = {
  timeout?: number
}

export const toast = writable<Toast | null>(null)

export const pushToast = (
  {message = "", id = randomId()}: Partial<Toast>,
  options: ToastOptions = {},
) => {
  toast.set({id, message, options})

  setTimeout(() => popToast(id), options.timeout || 5000)

  return id
}

export const popToast = (id: string) => toast.update($t => ($t?.id === id ? null : $t))

export const clip = (value: string) => {
  copyToClipboard(value)
  pushToast({message: "Copied to clipboard!"})
}
