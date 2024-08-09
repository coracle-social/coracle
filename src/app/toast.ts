import {writable} from "svelte/store"
import {randomId} from "@welshman/lib"
import {copyToClipboard} from '@lib/html'

export type ToastParams = {
  message: string
  timeout?: number
  theme?: "error"
}

export type Toast = ToastParams & {
  id: string
}

export const toast = writable<Toast | null>(null)

export const pushToast = (params: ToastParams) => {
  const id = randomId()

  toast.set({id, ...params})

  setTimeout(() => popToast(id), params.timeout || 5000)

  return id
}

export const popToast = (id: string) => toast.update($t => ($t?.id === id ? null : $t))

export const clip = (value: string) => {
  copyToClipboard(value)
  pushToast({message: "Copied to clipboard!"})
}
