import {getEventHash} from "nostr-tools"
import {assoc} from "ramda"
import {doPipe} from "hurdak/lib/hurdak"
import {now} from "src/util/misc"
import {queue} from "../util/queue"

export class Outbox {
  static contributeState() {
    return {
      queue: queue(),
    }
  }

  static contributeActions({Keys, Network, User, Events}) {
    const prepEvent = async rawEvent => {
      return doPipe(rawEvent, [
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
