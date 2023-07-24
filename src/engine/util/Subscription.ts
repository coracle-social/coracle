import EventEmitter from "events"
import {defer} from "hurdak"

export class Subscription extends EventEmitter {
  opened = Date.now()
  closed: number = null
  complete = defer()

  close = () => {
    if (!this.closed) {
      this.closed = Date.now()
      this.complete.resolve()
      this.emit("close")
      this.removeAllListeners()
    }
  }
}
