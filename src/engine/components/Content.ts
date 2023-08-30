import {nip19} from "nostr-tools"
import {nth, inc} from "ramda"
import {fuzzy} from "src/util/misc"
import {Tags} from "src/util/nostr"
import type {Topic, List} from "src/engine/types"
import {collection} from "src/engine/util/store"
import type {Engine} from "src/engine/Engine"
import type {Event} from "src/engine/types"

export class Content {
  labels = collection<Event>("id")
  topics = collection<Topic>("name")
  lists = collection<List>("naddr")
  searchTopics = this.topics.derived($topics => fuzzy($topics, {keys: ["name"], threshold: 0.3}))

  getLists = (f: (l: List) => boolean) =>
    this.lists.get().filter(l => !l.deleted_at && (f ? f(l) : true))

  initialize(engine: Engine) {
    const addTopic = name => {
      if (name) {
        const topic = this.topics.key(name).get()

        this.topics.key(name).merge({count: inc(topic?.count || 0)})
      }
    }

    const processTopics = (e: Event) => {
      const tagTopics = Tags.from(e).topics()
      const contentTopics = Array.from(e.content.toLowerCase().matchAll(/#(\w{2,100})/g)).map(
        nth(1)
      )

      for (const name of tagTopics.concat(contentTopics)) {
        addTopic(name)
      }
    }

    engine.Events.addHandler(1, processTopics)

    engine.Events.addHandler(42, processTopics)

    engine.Events.addHandler(1985, (e: Event) => {
      this.labels.key(e.id).set(e)

      for (const name of Tags.from(e).type("l").mark("#t").values().all()) {
        addTopic(name)
      }
    })

    engine.Events.addHandler(30001, (e: Event) => {
      const {pubkey, kind, created_at} = e
      const name = Tags.from(e).getMeta("d")
      const naddr = nip19.naddrEncode({identifier: name, pubkey, kind})
      const list = this.lists.key(naddr).get()

      if (created_at < list?.updated_at) {
        return
      }

      this.lists.key(naddr).merge({
        ...list,
        name,
        pubkey,
        tags: e.tags,
        updated_at: created_at,
        created_at: list?.created_at || created_at,
        deleted_at: undefined,
      })
    })

    engine.Events.addHandler(5, (e: Event) => {
      Tags.from(e)
        .type("a")
        .values()
        .all()
        .forEach(naddr => {
          const list = this.lists.key(naddr)

          if (list.exists()) {
            list.merge({deleted_at: e.created_at})
          }
        })
    })
  }
}
