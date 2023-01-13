import {get} from 'svelte/store'
import {sortBy, identity} from 'ramda'
import {createMap, ellipsize} from 'hurdak/lib/hurdak'
import {renderContent} from 'src/util/html'
import {Tags, displayPerson, findReply} from 'src/util/nostr'
import {people, getPerson} from 'src/agent'
import {routes} from "src/app/ui"

const renderNote = (note, {showEntire = false}) => {
  const shouldEllipsize = note.content.length > 500 && !showEntire
  const $people = get(people)
  const peopleByPubkey = createMap(
    'pubkey',
    Tags.from(note).type("p").values().all().map(k => $people[k]).filter(identity)
  )

  let content

  // Ellipsize
  content = shouldEllipsize ? ellipsize(note.content, 500) : note.content

  // Escape html, replace urls
  content = renderContent(content)

  // Mentions
  content = content
    .replace(/#\[(\d+)\]/g, (tag, i) => {
      if (!note.tags[parseInt(i)]) {
        return tag
      }

      const pubkey = note.tags[parseInt(i)][1]
      const person = peopleByPubkey[pubkey] || {pubkey}
      const name = displayPerson(person)
      const path = routes.person(pubkey)

      return `@<a href="${path}" class="underline">${name}</a>`
    })

  return content
}

const annotate = (note, context, {showEntire = false, depth = 1} = {}) => {
  const reactions = context.filter(e => e.kind === 7 && findReply(e) === note.id)
  const replies = context.filter(e => e.kind === 1 && findReply(e) === note.id)

  return {
    ...note, reactions,
    html: renderNote(note, {showEntire}),
    person: getPerson(note.pubkey),
    repliesCount: replies.length,
    replies: depth === 0
      ? []
      : sortBy(e => e.created_at, replies)
          .slice(showEntire ? 0 : -3)
          .map(r => annotate(r, context, {depth: depth - 1}))
  }
}

const threadify = (events, context, {muffle = []} = {}) => {
  const contextById = createMap('id', context)

  // Show parents when possible. For reactions, if there's no parent,
  // throw it away. Sort by created date descending
  const notes = sortBy(
    e => -e.created_at,
    events
      .map(e => contextById[findReply(e)] || (e.kind === 1 ? e : null))
      .filter(e => e && !muffle.includes(e.pubkey))
  )

  // Annotate our feed with parents, reactions, replies
  return notes.map(note => {
    let parent = contextById[findReply(note)]

    if (parent) {
      parent = annotate(parent, context)
    }

    return annotate({...note, parent}, context)
  })
}

export default {renderNote, threadify, annotate}
