export class LRUCache<T, U> {
  map = new Map<T, U>()
  keys: T[] = []

  constructor(readonly maxSize: number) {}

  has(k: T) {
    return this.map.has(k)
  }

  get(k: T) {
    const v = this.map.get(k)

    if (v !== undefined) {
      this.keys.push(this.keys.shift() as T)
    }

    return v
  }

  set(k: T, v: U) {
    this.map.set(k, v)
    this.keys.push(k)

    if (this.map.size > this.maxSize) {
      this.map.delete(this.keys.shift() as T)
    }
  }
}
