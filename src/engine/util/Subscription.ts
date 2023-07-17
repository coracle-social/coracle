import EventEmitter from "events"

export class Subscription extends EventEmitter {
  closed: boolean

  constructor() {
    super()

    this.closed = false
  }

  close = () => {
    if (!this.closed) {
      this.closed = true
      this.emit("close")
      this.removeAllListeners()
    }
  }
}
