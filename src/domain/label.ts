import {nth, spec} from "@welshman/lib"
import {LABEL, hexTags, matchTags, tagSpec, tagValues, userOutbox} from "@welshman/util"
import {EventQuery, EventReader, EventWriter, KindFactory} from "@welshman/domain"

// NIP-32 label. `L` declares a namespace, `l` carries the labels within it.
export class LabelReader extends EventReader {
  namespaces() {
    return tagValues(tagSpec("L"), this.event.tags)
  }

  labels(namespace?: string) {
    return matchTags(tagSpec("l"), this.event.tags)
      .filter(t => !namespace || t[2] === namespace)
      .map(nth(1))
  }

  eventIds() {
    return tagValues(hexTags("e"), this.event.tags)
  }

  pubkeys() {
    return tagValues(hexTags("p"), this.event.tags)
  }
}

export class LabelWriter extends EventWriter<LabelReader> {
  // A label is the author's own data, so it goes to their outbox and nowhere else
  protected async renderRoutes() {
    return [userOutbox()]
  }

  setEventId(id: string) {
    return this.dropTags(spec(["e"])).addTags(["e", id])
  }

  addLabel(name: string, namespace: string) {
    for (const tag of [
      ["L", namespace],
      ["l", name, namespace],
    ]) {
      if (!this.extraTags.some(spec(tag))) {
        this.addTags(tag)
      }
    }

    return this
  }
}

export class LabelQuery extends EventQuery {
  protected renderRoutes() {
    return [...this.authorRoutes(), ...this.mentionRoutes()]
  }
}

export const Label = new KindFactory({
  kind: LABEL,
  reader: LabelReader,
  writer: LabelWriter,
  query: LabelQuery,
})
