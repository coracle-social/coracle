import EventEmitter from "events"
import {last, uniqBy} from "ramda"
import {doPipe, defer, union, difference} from "hurdak"
import {info} from "src/util/logger"
import {now} from "src/util/misc"
import {parseContent} from "src/util/notes"
import {Tags, findRoot, findReply} from "src/util/nostr"
import type {Event, NostrEvent} from "src/engine/events/model"
import {people} from "src/engine/people/state"
import {displayPerson} from "src/engine/people/utils"
import {getUserRelayUrls, getEventHint, getPubkeyHint} from "src/engine/relays/utils"
import {signer} from "src/engine/session/derived"
import {projections} from "src/engine/core/projections"
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
  event: NostrEvent

  constructor(event: NostrEvent) {
    super()

    if ((event as Event).wrap) {
      throw new Error("Can't publish unwrapped events")
    }

    this.event = event
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

    projections.push({...this.event, seen_on: []})

    setTimeout(() => {
      for (const url of urls) {
        if (!succeeded.has(url) && !failed.has(url)) {
          timeouts.add(url)
        }
      }

      attemptToResolve()
    }, timeout)

    // return console.log('PUBLISH', this.event)

    const sub = executor.publish(this.event, {
      verb,
      onOk: (url: string) => {
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

export const buildEvent = (
  kind: number,
  {content = "", tags = [], created_at = null}: EventOpts
) => {
  return {kind, content, tags, created_at: created_at || now()}
}

export type PublishOpts = EventOpts & {
  relays?: string[]
}

export const publishEvent = async (
  kind: number,
  {relays, content = "", tags = []}: PublishOpts
) => {
  return Publisher.publish({
    timeout: 5000,
    relays: relays || getUserRelayUrls("write"),
    event: await signer.get().signAsUser(
      buildEvent(kind, {
        content,
        tags: uniqTags([...tags, ...tagsFromContent(content)]),
      })
    ),
  })
}

export const uniqTags = uniqBy((t: string[]) => t.slice(0, 2).join(":"))

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

export const getReplyTags = (n: Event, inherit = false) => {
  const extra = inherit
    ? Tags.from(n)
        .type("e")
        .reject(t => last(t) === "mention")
        .all()
        .map(t => t.slice(0, 3))
    : []
  const eHint = getEventHint(n)
  const reply = ["e", n.id, eHint, "reply"]
  const root = doPipe(findRoot(n) || findReply(n) || reply, [
    t => (t.length < 3 ? t.concat(eHint) : t),
    t => t.slice(0, 3).concat("root"),
  ])

  return [mention(n.pubkey), root, ...extra, reply]
}
