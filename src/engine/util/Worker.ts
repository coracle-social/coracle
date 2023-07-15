export class Worker<T> {
  buffer: T[]
  handlers: Array<(x: T) => void>
  timeout: NodeJS.Timeout

  constructor() {
    this.buffer = []
    this.handlers = []
  }

  #doWork = async () => {
    for (const message of this.buffer.splice(0, 50)) {
      for (const handler of this.handlers) {
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

  push = message => {
    this.buffer.push(message)
    this.#enqueueWork()
  }

  listen = handler => {
    this.handlers.push(handler)
  }
}
