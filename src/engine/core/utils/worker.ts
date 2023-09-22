const ANY = "worker/ANY"

export type WorkerOpts<T> = {
  getKey: (x: T) => any
}

export class Worker<T> {
  buffer: T[] = []
  handlers: Map<any, Array<(x: T) => void>> = new Map()
  timeout: NodeJS.Timeout | undefined

  constructor(readonly opts: WorkerOpts<T>) {}

  #doWork = async () => {
    for (const message of this.buffer.splice(0, 50)) {
      const k = this.opts.getKey(message)

      for (const handler of this.handlers.get(ANY) || []) {
        await handler(message)
      }

      for (const handler of this.handlers.get(k) || []) {
        await handler(message)
      }
    }

    this.timeout = undefined

    this.#enqueueWork()
  }

  #enqueueWork = () => {
    if (!this.timeout && this.buffer.length > 0) {
      this.timeout = setTimeout(this.#doWork, 50)
    }
  }

  push = (message: T) => {
    this.buffer.push(message)
    this.#enqueueWork()
  }

  addHandler = (k, handler: (message: T) => void) => {
    if (!this.handlers.has(k)) {
      this.handlers.set(k, [])
    }

    this.handlers.get(k).push(handler)
  }

  addGlobalHandler = (handler: (message: T) => void) => {
    this.addHandler(ANY, handler)
  }
}
