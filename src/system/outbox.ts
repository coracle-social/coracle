import {assoc} from "ramda"
import {getEventHash} from "nostr-tools"
import {doPipe} from "hurdak/lib/hurdak"
import {now} from "src/util/misc"
import type Sync from "src/system/sync"
import type Keys from "src/system/keys"
import type Network from "src/system/network"

export default class Outbox {
  keys: Keys
  sync: Sync
  network: Network
  constructor(ns, {keys, sync, network}) {
    this.keys = keys
    this.sync = sync
    this.network = network
  }
  async prep(rawEvent) {
    return doPipe(rawEvent, [
      assoc("created_at", now()),
      assoc("pubkey", this.keys.getPubkey()),
      e => ({...e, id: getEventHash(e)}),
      this.keys.sign,
    ])
  }
  async publish(event, relays, onProgress = null, verb = "EVENT") {
    if (!event.sig) {
      event = await this.prep(event)
    }

    // return console.log(event)

    const promise = this.network.publish({relays, event, onProgress, verb})

    this.sync.processEvents(event)

    return [event, promise]
  }
}
