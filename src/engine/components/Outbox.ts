import {getEventHash} from "nostr-tools"
import type {UnsignedEvent} from "nostr-tools"
import {now} from "src/util/misc"
import type {Progress} from "src/engine/components/Network"
import type {Engine} from "src/engine/Engine"
import type {Event} from "src/engine/types"

export class Outbox {
  engine: Engine

  prepEvent = async (rawEvent: Partial<Event>): Promise<Event> => {
    if (rawEvent.sig) {
      return rawEvent as Event
    }

    const event = {
      ...rawEvent,
      created_at: now(),
      pubkey: this.engine.Keys.pubkey.get(),
    }

    event.id = getEventHash(event as UnsignedEvent)

    return this.engine.Keys.sign(event as Event)
  }

  publish = async (
    rawEvent: Partial<Event>,
    relays: string[] = null,
    onProgress: (p: Progress) => void = null,
    verb = "EVENT"
  ): Promise<[Event, Promise<Progress>]> => {
    const event = rawEvent.sig ? (rawEvent as Event) : await this.prepEvent(rawEvent)

    if (!relays) {
      relays = this.engine.User.getRelayUrls("write")
    }

    // return console.log(event)

    this.engine.Events.queue.push(event)

    return [event, this.engine.Network.publish({event, relays, onProgress, verb})]
  }

  initialize(engine: Engine) {
    this.engine = engine
  }
}
