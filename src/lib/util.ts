import Fuse from "fuse.js"
import type {IFuseOptions, FuseResult} from 'fuse.js'
import {throttle} from 'throttle-debounce'
import {writable} from 'svelte/store'
import {sortBy} from '@welshman/lib'
import {browser} from '$app/environment'

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

export type SearchOptions<V, T> = {
  getValue: (item: T) => V
  fuseOptions?: IFuseOptions<T>
  sortFn?: (items: FuseResult<T>) => any
}

export const createSearch = <V, T>(data: T[], opts: SearchOptions<V, T>) => {
  const fuse = new Fuse(data, {...opts.fuseOptions, includeScore: true})
  const map = new Map<V, T>(data.map(item => [opts.getValue(item), item]))

  const search = (term: string) => {
    let results = term ? fuse.search(term) : data.map(item => ({item, score: 1}) as FuseResult<T>)

    if (opts.sortFn) {
      results = sortBy(opts.sortFn, results)
    }

    return results.map(result => result.item)
  }

  return {
    getValue: opts.getValue,
    getOption: (value: V) => map.get(value),
    searchOptions: (term: string) => search(term),
    searchValues: (term: string) => search(term).map(opts.getValue),
  }
}
