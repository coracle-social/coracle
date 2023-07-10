import {assoc} from "ramda"
import {getEventHash} from "nostr-tools"
import {doPipe} from "hurdak/lib/hurdak"
import {now} from "src/util/misc"
import type {System} from "src/system/system"

export class Outbox {
  system: System
  constructor(system) {
    this.system = system
  }

  async prep(rawEvent) {
    return doPipe(rawEvent, [
      assoc("created_at", now()),
      assoc("pubkey", this.system.user.getPubkey()),
      e => ({...e, id: getEventHash(e)}),
      this.system.user.keys.sign,
    ])
  }

  async publish(event, relays, onProgress = null, verb = "EVENT") {
    if (!event.sig) {
      event = await this.prep(event)
    }

    // return console.log(event)

    const promise = this.system.network.publish({relays, event, onProgress, verb})

    this.system.sync.processEvents(event)

    return [event, promise]
  }
}
