import {first, parseJson, spec} from "@welshman/lib"
import type {Maybe} from "@welshman/lib"
import {
  GENERIC_REPOST,
  NOTE,
  REPOST,
  getAddress,
  isReplaceable,
  kindTags,
  outbox,
  tagSpec,
  tagValue,
  tagValues,
} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {EventQuery, EventReader, EventWriter, KindFactory} from "@welshman/domain"
import {profiles} from "src/engine/core"

const TARGET_KEYS = ["e", "a", "p", "k"]

// NIP-18 repost. The reposted event is JSON-encoded in the content.
export class RepostReader extends EventReader {
  eventId() {
    return tagValue(tagSpec("e"), this.event.tags)
  }

  eventAddress() {
    return tagValue(tagSpec("a"), this.event.tags)
  }

  pubkey() {
    return tagValue(tagSpec("p"), this.event.tags)
  }

  // Kind 6 only reposts notes; kind 16 names the reposted kind in a k tag.
  eventKind() {
    return this.kind === REPOST ? NOTE : first(tagValues(kindTags("k"), this.event.tags))
  }

  repostedEvent() {
    return parseJson(this.event.content) as Maybe<TrustedEvent>
  }
}

export class RepostWriter extends EventWriter<RepostReader> {
  // A repost wraps exactly one event, so replace any existing target.
  setEvent(event: TrustedEvent) {
    this.dropTags(t => TARGET_KEYS.includes(t[0]))
    this.setContent(JSON.stringify(event))

    // Hint slot is index 2; NIP-18 puts the marker and the author's pubkey after it
    const tags = [["e", event.id, "", "", event.pubkey]]

    if (isReplaceable(event)) {
      tags.push(["a", getAddress(event), "", "", event.pubkey])
    }

    tags.push(["p", event.pubkey, "", profiles.get().display(event.pubkey).get()])

    this.addTags(...tags)
    this.hint(outbox(event.pubkey)).then(url => {
      for (const tag of tags) {
        tag[2] = url
      }
    })

    if (this.kind === GENERIC_REPOST) {
      this.addTags(["k", String(event.kind)])
    }

    return this
  }

  validate() {
    super.validate()

    if (!this.extraTags.some(spec(["e"]))) {
      throw new Error("A repost must reference an event via an e tag")
    }
  }
}

export class RepostQuery extends EventQuery {
  protected renderRoutes() {
    return [...this.authorRoutes(), ...this.mentionRoutes()]
  }
}

export const Repost = new KindFactory({
  kind: REPOST,
  reader: RepostReader,
  writer: RepostWriter,
  query: RepostQuery,
})

export const GenericRepost = new KindFactory({
  kind: GENERIC_REPOST,
  reader: RepostReader,
  writer: RepostWriter,
  query: RepostQuery,
})

// NIP-18 reposts notes with kind 6 and everything else with kind 16
export const repostKind = (kind: number) => (kind === NOTE ? Repost : GenericRepost)
