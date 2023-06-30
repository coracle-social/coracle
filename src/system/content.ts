import {sortBy, nth, inc} from "ramda"
import {fuzzy} from "src/util/misc"
import {Tags} from "src/util/nostr"
import {Table, watch} from "src/agent/db"

export default ({sync}) => {
  const topics = new Table("content/topics", "name", {sort: sortBy(e => -e.count)})

  const processTopics = e => {
    const tagTopics = Tags.from(e).topics()
    const contentTopics = Array.from(e.content.toLowerCase().matchAll(/#(\w{2,100})/g)).map(nth(1))

    for (const name of tagTopics.concat(contentTopics)) {
      const topic = topics.get(name)

      topics.patch({name, count: inc(topic?.count || 0)})
    }
  }

  sync.addHandler(1, processTopics)
  sync.addHandler(42, processTopics)

  const searchTopics = watch(topics, () => fuzzy(topics.all(), {keys: ["name"], threshold: 0.3}))

  return {
    topics,
    searchTopics,
  }
}
