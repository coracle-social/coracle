import {getEventHash, getPublicKey} from "nostr-tools"
import type {UnsignedEvent} from "nostr-tools"
import {now} from "src/util/misc"
import type {Event} from "src/engine/types"
import type {Engine} from "src/engine/Engine"
import type {WrapOpts} from "src/engine/components/Nip59"
import type {PublishOpts as NetworkPublishOpts} from "src/engine/components/Network"

export type PublishOpts = Omit<NetworkPublishOpts, "event"> & {
  event: Partial<Event>
  wrapWith?: WrapOpts
  sk?: string
}

export class Outbox {
  engine: Engine

  prep = async (rawEvent: Partial<Event>, sk?: string): Promise<Event> => {
    if (rawEvent.sig) {
      return rawEvent as Event
    }

    const event = {
      ...rawEvent,
      created_at: now(),
      pubkey: sk ? getPublicKey(sk) : this.engine.Keys.pubkey.get(),
    }

    event.id = getEventHash(event as UnsignedEvent)

    return this.engine.Keys.sign(event as Event, sk)
  }

  publish = async ({event, sk, wrapWith, ...opts}: PublishOpts) => {
    const {Nip59, Events, Network} = this.engine

    if (wrapWith) {
      event = await Nip59.wrap(event, wrapWith)
    }

    if (!event.sig) {
      event = await this.prep(event, sk)
    }

    Events.queue.push(event as Event)

    return Network.publish({...opts, event} as NetworkPublishOpts)
  }

  initialize(engine: Engine) {
    this.engine = engine
  }
}
