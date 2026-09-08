import {spec} from "@welshman/lib"
import {REVIEW, tagSpec, tagValue, userOutbox} from "@welshman/util"
import {EventQuery, EventReader, EventWriter, KindFactory} from "@welshman/domain"

const NAMESPACE_KEYS = ["L", "l", "r"]

// NIP-32 flavored review. Coracle only publishes relay reviews, which carry a
// numeric rating and the url of the relay being reviewed.
export class ReviewReader extends EventReader {
  rating() {
    const value = tagValue(tagSpec("rating"), this.event.tags)

    return value ? parseFloat(value) : undefined
  }

  relayUrl() {
    return tagValue(tagSpec("r"), this.event.tags)
  }
}

export class ReviewWriter extends EventWriter<ReviewReader> {
  // A review is the author's own opinion, so it goes to their outbox and nowhere else
  protected async renderRoutes() {
    return [userOutbox()]
  }

  setRating(rating: number) {
    return this.dropTags(spec(["rating"])).addTags(["rating", String(rating)])
  }

  // The label tags are how other clients find reviews of a given relay
  setRelayUrl(url: string) {
    return this.dropTags(t => NAMESPACE_KEYS.includes(t[0])).addTags(
      ["L", "review"],
      ["l", "review/relay", "review"],
      ["r", url],
    )
  }
}

export class ReviewQuery extends EventQuery {
  protected renderRoutes() {
    return this.authorRoutes()
  }
}

export const Review = new KindFactory({
  kind: REVIEW,
  reader: ReviewReader,
  writer: ReviewWriter,
  query: ReviewQuery,
})
