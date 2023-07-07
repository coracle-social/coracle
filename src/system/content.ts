import {nip19} from "nostr-tools"
import {sortBy, nth, inc} from "ramda"
import {fuzzy} from "src/util/misc"
import {Tags} from "src/util/nostr"
import {Table, watch} from "src/util/loki"

export default ({keys, sync, getCmd, getUserWriteRelays}) => {
  const topics = new Table("content/topics", "name", {sort: sortBy(e => -e.count)})

  // Topics

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

  // Lists

  const lists = new Table("content/lists", "naddr")

  sync.addHandler(30001, e => {
    const {pubkey, kind, created_at} = e
    const name = Tags.from(e).getMeta("d")
    const naddr = nip19.naddrEncode({identifier: name, pubkey, kind})
    const list = lists.get(naddr)

    if (created_at < list?.updated_at) {
      return
    }

    lists.patch({
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

  sync.addHandler(5, e => {
    Tags.from(e)
      .type("a")
      .values()
      .all()
      .forEach(naddr => {
        const list = lists.get(naddr)

        if (list) {
          lists.patch({
            naddr: list.naddr,
            deleted_at: e.created_at,
          })
        }
      })
  })

  const getLists = (spec = null) => lists.all({...spec, deleted_at: {$eq: null}})

  const getUserLists = (spec = null) => getLists({...spec, pubkey: keys.getPubkey()})

  const putList = (name, params, relays) => {
    const tags = [["d", name]].concat(params).concat(relays)

    return getCmd().createList(tags).publish(getUserWriteRelays())
  }

  const removeList = naddr => {
    return getCmd().deleteNaddrs([naddr]).publish(getUserWriteRelays())
  }

  return {
    topics,
    searchTopics,
    lists,
    getLists,
    getUserLists,
    putList,
    removeList,
  }
}
