import {throttle} from 'throttle-debounce'
import {browser} from '$app/environment'
import {writable} from 'svelte/store'

export const parseJson = (json: string) => {
  if (!json) return null

  try {
    return JSON.parse(json)
  } catch (e) {
    return null
  }
}

export const getJson = (k: string) =>
  browser ? parseJson(localStorage.getItem(k) || "") : null

export const setJson = (k: string, v: any) => {
  if (browser) {
    localStorage.setItem(k, JSON.stringify(v))
  }
}

export const synced = <T>(key: string, defaultValue: T, delay = 300) => {
  const init = getJson(key)
  const store = writable<T>(init === null ? defaultValue : init)

  store.subscribe(throttle(delay, (value: T) => setJson(key, value)))

  return store
}
