import EventEmitter from "events"
import {createEvent} from "paravel"
import {last, omit, uniqBy} from "ramda"
import {doPipe, defer, union, difference} from "hurdak"
import {info} from "src/util/logger"
import {parseContent} from "src/util/notes"
import {Tags, findRoot, findReply} from "src/util/nostr"
import type {Event, NostrEvent} from "src/engine/events/model"
import {people} from "src/engine/people/state"
import {displayPerson} from "src/engine/people/utils"
import {getUserRelayUrls, getEventHint, getPubkeyHint} from "src/engine/relays/utils"
import {signer} from "src/engine/session/derived"
import {projections} from "src/engine/core/projections"
import {Naddr, isReplaceable} from "src/engine/events/utils"
import {getUrls, getExecutor} from "./executor"

export type PublisherOpts = {
  timeout?: number
  verb?: string
}

export type StaticPublisherOpts = PublisherOpts & {
  event: NostrEvent
  relays: string[]
}

export class Publisher extends EventEmitter {
  result = defer()
  event: Event

  constructor(event: NostrEvent) {
    super()

    if ((event as Event).wrap) {
      throw new Error("Can't publish unwrapped events")
    }

    this.event = {...event, seen_on: []}
  }

  static publish({event, relays, ...opts}: StaticPublisherOpts) {
    const publisher = new Publisher(event)

    publisher.publish(relays, opts)

    return publisher
  }

  publish(relays, {timeout = 10_000, verb}: PublisherOpts = {}) {
    const urls = getUrls(relays)
    const executor = getExecutor(urls)

    info(`Publishing to ${urls.length} relays`, this.event, urls)

    const timeouts = new Set<string>()
    const succeeded = new Set<string>()
    const failed = new Set<string>()

    const getProgress = () => {
      const attempted = new Set(urls)
      const completed = union(timeouts, succeeded, failed)
      const pending = difference(attempted, completed)

      return {event: this.event, attempted, succeeded, failed, timeouts, completed, pending}
    }

    const attemptToResolve = () => {
      const progress = getProgress()

      if (progress.pending.size === 0) {
        sub.unsubscribe()
        executor.target.cleanup()
        this.result.resolve(progress)
      }

      this.emit("progress", progress)
    }

    // return

    projections.push(this.event)

    setTimeout(() => {
      for (const url of urls) {
        if (!succeeded.has(url) && !failed.has(url)) {
          timeouts.add(url)
        }
      }

      attemptToResolve()
    }, timeout)

    const sub = executor.publish(omit(["seen_on"], this.event), {
      verb,
      onOk: (url: string) => {
        this.event.seen_on.push(url)

        succeeded.add(url)
        timeouts.delete(url)
        failed.delete(url)
        attemptToResolve()
      },
      onError: (url: string) => {
        failed.add(url)
        timeouts.delete(url)
        attemptToResolve()
      },
    })

    // Report progress to start with
    attemptToResolve()
  }
}

export type EventOpts = {
  created_at?: number
  content?: string
  tags?: string[][]
}

export type PublishOpts = EventOpts & {
  sk?: string
  relays?: string[]
}

export const publishEvent = async (
  kind: number,
  {relays, content = "", tags = [], sk}: PublishOpts
) => {
  const template = createEvent(kind, {
    content,
    tags: uniqTags([...tags, ...tagsFromContent(content)]),
  })

  return Publisher.publish({
    timeout: 5000,
    relays: relays || getUserRelayUrls("write"),
    event: sk
      ? await signer.get().signWithKey(template, sk)
      : await signer.get().signAsUser(template),
  })
}

export const uniqTags = uniqBy((t: string[]) =>
  t[0] === "param" ? t.join(":") : t.slice(0, 2).join(":")
)

export const getPubkeyPetname = (pubkey: string) => {
  const person = people.key(pubkey).get()

  return person ? displayPerson(person) : ""
}

export const mention = (pubkey: string): string[] => {
  const hint = getPubkeyHint(pubkey)
  const petname = getPubkeyPetname(pubkey)

  return ["p", pubkey, hint, petname]
}

export const tagsFromContent = (content: string) => {
  const tags = []

  for (const {type, value} of parseContent({content, tags: []})) {
    if (type === "topic") {
      tags.push(["t", value])
    }

    if (type.match(/nostr:(note|nevent)/)) {
      tags.push(["e", value.id, value.relays?.[0] || "", "mention"])
    }

    if (type.match(/nostr:(nprofile|npub)/)) {
      tags.push(mention(value.pubkey))
    }
  }

  return tags
}

export const getReplyTags = (parent: Event, inherit = false) => {
  const extra = inherit
    ? Tags.from(parent)
        .type(["e", "a"])
        .reject(t => last(t) === "mention")
        .all()
        .map(t => t.slice(0, 3))
    : []
  const hint = getEventHint(parent)
  const reply = ["e", parent.id, hint, "reply"]
  const root = doPipe(findRoot(parent) || findReply(parent) || reply, [
    t => (t.length < 3 ? t.concat(hint) : t),
    t => t.slice(0, 3).concat("root"),
  ])

  if (isReplaceable(parent)) {
    extra.push(Naddr.fromEvent(parent).asTag("reply"))
  }

  return [mention(parent.pubkey), root, ...extra, reply]
}
