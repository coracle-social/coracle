import {nth, inc} from "ramda"
import {Tags} from "src/util/nostr"
import type {Event} from "src/engine2/model"
import {topics} from "src/engine2/state"
import {projections} from "src/engine2/projections/core"

const addTopic = (e, name) => {
  if (name) {
    const topic = topics.key(name)

    topic.merge({
      count: inc(topic.get()?.count || 0),
      last_seen: e.created_at,
    })
  }
}

const processTopics = (e: Event) => {
  const tagTopics = Tags.from(e).topics()
  const contentTopics = Array.from(e.content.toLowerCase().matchAll(/#(\w{2,100})/g)).map(nth(1))

  for (const name of tagTopics.concat(contentTopics)) {
    addTopic(e, name)
  }
}

projections.addHandler(1, processTopics)

projections.addHandler(42, processTopics)

projections.addHandler(1985, (e: Event) => {
  for (const name of Tags.from(e).type("l").mark("#t").values().all()) {
    addTopic(e, name)
  }
})
