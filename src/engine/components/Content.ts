import {nip19} from "nostr-tools"
import {always, nth, inc} from "ramda"
import {fuzzy} from "src/util/misc"
import {Tags} from "src/util/nostr"
import type {Topic, List} from "src/engine/types"
import {derived, collection} from "../util/store"

export class Content {
  static contributeState() {
    const topics = collection<Topic>()

    const lists = collection<List>()

    return {topics, lists}
  }

  static contributeSelectors({Content}) {
    const getLists = (f = always(true)) => Content.lists.get().filter(l => !l.deleted_at && f(l))

    const searchTopics = derived(Content.topics, $topics =>
      fuzzy($topics.values(), {keys: ["name"], threshold: 0.3})
    )

    return {getLists, searchTopics}
  }

  static initialize({Events, Content}) {
    const processTopics = e => {
      const tagTopics = Tags.from(e).topics()
      const contentTopics = Array.from(e.content.toLowerCase().matchAll(/#(\w{2,100})/g)).map(
        nth(1)
      )

      for (const name of tagTopics.concat(contentTopics)) {
        const topic = Content.topics.getKey(name)

        Content.topics.mergeKey(name, {name, count: inc(topic?.count || 0)})
      }
    }

    Events.addHandler(1, processTopics)

    Events.addHandler(42, processTopics)

    Events.addHandler(30001, e => {
      const {pubkey, kind, created_at} = e
      const name = Tags.from(e).getMeta("d")
      const naddr = nip19.naddrEncode({identifier: name, pubkey, kind})
      const list = Content.lists.getKey(naddr)

      if (created_at < list?.updated_at) {
        return
      }

      Content.lists.mergeKey(naddr, {
        ...list,
        name,
        naddr,
        pubkey,
        tags: e.tags,
        updated_at: created_at,
        created_at: list?.created_at || created_at,
        deleted_at: null,
      })
    })

    Events.addHandler(5, e => {
      Tags.from(e)
        .type("a")
        .values()
        .all()
        .forEach(naddr => {
          const list = Content.lists.getKey(naddr)

          if (list) {
            Content.lists.mergeKey(naddr, {deleted_at: e.created_at})
          }
        })
    })
  }
}
