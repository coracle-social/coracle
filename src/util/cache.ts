import {sortBy, nth} from "ramda"

type CacheEntry = [string, {value: any; lru: number}]

type SortFn = (xs: Array<CacheEntry>) => Array<CacheEntry>

type CacheOptions = {
  max?: number
  sort?: SortFn
}

const sortByLru = sortBy(([k, x]) => x.lru)

export default class Cache {
  max: number
  sort: SortFn
  data: Map<string, any>
  lru: Map<string, number>
  constructor({max = 1000, sort = sortByLru}: CacheOptions = {}) {
    this.max = max
    this.sort = sort
    this.data = new Map()
    this.lru = new Map()
  }
  set(k, v) {
    this.data.set(k, v)
    this.lru.set(k, Date.now())
  }
  delete(k) {
    this.data.delete(k)
    this.lru.delete(k)
  }
  get(k) {
    return this.data.get(k)
  }
  size() {
    return this.data.size
  }
  entries() {
    return this.data.entries()
  }
  keys() {
    return this.data.keys()
  }
  values() {
    return this.data.values()
  }
  find(f) {
    for (const v of this.data.values()) {
      if (f(v)) {
        return v
      }
    }
  }
  load(entries) {
    for (const [k, {value, lru}] of entries) {
      this.data.set(k, value)
      this.lru.set(k, lru)
    }
  }
  dump(): Array<CacheEntry> {
    return Array.from(this.data.keys()).map(k => [
      k,
      {value: this.data.get(k), lru: this.lru.get(k)},
    ])
  }
  prune() {
    if (this.data.size <= this.max) {
      return
    }

    for (const k of this.sort(this.dump()).map(nth(0)).slice(this.max)) {
      this.delete(k)
    }
  }
  clear() {
    this.data.clear()
    this.lru.clear()
  }
}
