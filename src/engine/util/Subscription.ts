import EventEmitter from "events"
import type {Deferred} from "src/util/misc"
import {defer} from "src/util/misc"

export class Subscription extends EventEmitter {
  closed: boolean
  complete: Deferred<void>

  constructor() {
    super()

    this.closed = false
    this.complete = defer()
  }

  close = () => {
    if (!this.closed) {
      this.closed = true
      this.complete.resolve()
      this.emit("close")
      this.removeAllListeners()
    }
  }
}
