import {last} from 'ramda'
import {ensurePlural, first} from 'hurdak/lib/hurdak'

export const filterTags = (where, events) =>
  ensurePlural(events)
    .flatMap(
      e => e.tags.filter(t => {
        if (where.tag && where.tag !== t[0]) {
          return false
        }

        if (where.type && where.type !== last(t)) {
          return false
        }

        return true
      }).map(t => t[1])
    )

export const findTag = (where, events) => first(filterTags(where, events))

// Support the deprecated version where tags are not marked as replies
export const findReply = e =>
  findTag({tag: "e", type: "reply"}, e) || findTag({tag: "e"}, e)

export const findRoot = e =>
  findTag({tag: "e", type: "root"}, e)
