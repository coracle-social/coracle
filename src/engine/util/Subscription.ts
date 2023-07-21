import EventEmitter from "events"
import {defer} from "hurdak"

export class Subscription extends EventEmitter {
  closed = false
  complete = defer()

  close = () => {
    if (!this.closed) {
      this.closed = true
      this.complete.resolve()
      this.emit("close")
      this.removeAllListeners()
    }
  }
}
