import {last, find, intersection} from 'ramda'
import {ensurePlural, first} from 'hurdak/lib/hurdak'

export const epoch = 1633046400

export const getTagValues = tags => tags.map(t => t[1])

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

export const filterMatches = (filter, e)  => {
  return Boolean(find(
    f => {
      return (
           (!f.ids     || f.ids.includes(e.id))
        && (!f.authors || f.authors.includes(e.pubkey))
        && (!f.kinds   || f.kinds.includes(e.kind))
        && (!f['#e']   || intersection(f['#e'], e.tags.filter(t => t[0] === 'e').map(t => t[1])))
        && (!f['#p']   || intersection(f['#p'], e.tags.filter(t => t[0] === 'p').map(t => t[1])))
        && (!f.since   || f.since >= e.created_at)
        && (!f.until   || f.until <= e.created_at)
      )
    },
    ensurePlural(filter)
  ))
}

export const getMuffleValue = person => {
  if (!person) {
    return 1
  }

  const tag = find(t => t[1] === person.pubkey, person.muffle)

  if (!tag) {
    return 1
  }

  return parseFloat(last(tag))
}
