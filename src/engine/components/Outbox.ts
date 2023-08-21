import {getEventHash} from "nostr-tools"
import type {UnsignedEvent} from "nostr-tools"
import {info} from "src/util/logger"
import {now} from "src/util/misc"
import type {Event} from "src/engine/types"
import type {Engine} from "src/engine/Engine"
import type {PublishOpts} from "src/engine/components/Network"

export class Outbox {
  engine: Engine

  prep = async (rawEvent: Partial<Event>): Promise<Event> => {
    if (rawEvent.sig) {
      return rawEvent as Event
    }

    const event = {
      ...rawEvent,
      created_at: now(),
      pubkey: this.engine.Keys.pubkey.get(),
    }

    info("Attempting to sign event", event)

    event.id = getEventHash(event as UnsignedEvent)

    return this.engine.Keys.sign(event as Event)
  }

  publish = async ({event, ...opts}: Omit<PublishOpts, "event"> & {event: Partial<Event>}) => {
    event = event.sig ? event : await this.prep(event)

    // return console.log(event)

    this.engine.Events.queue.push(event as Event)

    return this.engine.Network.publish({...opts, event} as PublishOpts)
  }

  initialize(engine: Engine) {
    this.engine = engine
  }
}
