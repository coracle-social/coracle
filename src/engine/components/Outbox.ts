import type {Event} from "src/engine/types"
import {getEventHash} from "nostr-tools"
import {assoc} from "ramda"
import {doPipe} from "hurdak"
import {now} from "src/util/misc"
import {Worker} from "../util/Worker"

export class Outbox {
  static contributeState() {
    return {
      queue: new Worker<Event>(),
    }
  }

  static contributeActions({Keys, Network, User, Events}) {
    const prepEvent = async rawEvent => {
      return await doPipe(rawEvent, [
        assoc("created_at", now()),
        assoc("pubkey", Keys.pubkey.get()),
        e => ({...e, id: getEventHash(e)}),
        Keys.sign,
      ])
    }

    const publish = async (event, relays = null, onProgress = null, verb = "EVENT") => {
      if (!event.sig) {
        event = await prepEvent(event)
      }

      if (!relays) {
        relays = User.getRelayUrls("write")
      }

      // return console.log(event)

      const promise = Network.publish({event, relays, onProgress, verb})

      Events.queue.push(event)

      return [event, promise]
    }

    return {prepEvent, publish}
  }

  static initialize({Outbox}) {
    Outbox.queue.listen(({event}) => Outbox.publish(event))
  }
}
