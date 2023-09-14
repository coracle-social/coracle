import {matchFilters} from "nostr-tools"
import {throttle} from "throttle-debounce"
import {omit, find, pluck, flatten, without, groupBy, sortBy, prop, uniqBy, reject} from "ramda"
import {ensurePlural, batch, chunk} from "hurdak"
import {now, pushToKey} from "src/util/misc"
import {findReplyAndRootIds, findReplyId, findRootId, Tags, reactionKinds} from "src/util/nostr"
import {collection} from "src/engine2/util/store"
import type {Collection} from "src/engine2/util/store"
import type {Event, DisplayEvent, Filter} from "src/engine2/model"
import {env} from "src/engine2/state"
import {
  mergeHints,
  isEventMuted,
  getReplyHints,
  getRootHints,
  getParentHints,
} from "src/engine2/queries"
import {subscribe} from "./subscription"
import {loadPubkeys} from "./pubkeys"
import {getIdFilters} from "./filter"
import {load} from "./load"

const fromDisplayEvent = (e: DisplayEvent): Event =>
  omit(["zaps", "likes", "replies", "matchesFilter"], e)

export type ContextLoaderOpts = {
  relays?: string[]
  filters?: Filter[]
  onEvent?: (e: Event) => void
  shouldLoadParents?: boolean
}

export class ContextLoader {
  stopped: boolean
  data: Collection<Event>
  seen: Set<string>
  subs: {close: () => void}[]

  constructor(readonly opts: ContextLoaderOpts) {
    this.stopped = false
    this.data = collection<Event>("id")
    this.seen = new Set()
    this.subs = []
  }

  // Utils

  addSubs(subs) {
    for (const sub of subs) {
      this.subs.push(sub)

      sub.on("close", () => {
        this.subs = without([sub], this.subs)
      })
    }
  }

  getReplyKinds() {
    const {ENABLE_ZAPS} = env.get()

    return ENABLE_ZAPS ? [1, 7, 9735] : [1, 7]
  }

  matchFilters(e: Event) {
    return !this.opts.filters || matchFilters(ensurePlural(this.opts.filters), e)
  }

  isTextNote(e: Event) {
    return !reactionKinds.includes(e.kind)
  }

  isMissingParent = (e: Event) => {
    const parentId = findReplyId(e)

    return parentId && this.matchFilters(e) && !this.data.key(parentId).exists()
  }

  preprocessEvents = (events: Event[]) => {
    events = reject((e: Event) => this.seen.has(e.id) || isEventMuted(e).get(), events)

    for (const event of events) {
      this.seen.add(event.id)
    }

    return events
  }

  mergeHints(groups: string[][]) {
    if (this.opts.relays) {
      return this.opts.relays
    }

    return mergeHints(groups)
  }

  applyContext = (notes: Event[], {substituteParents = false, alreadySeen = new Set()} = {}) => {
    const contextById = {} as Record<string, Event>
    const zapsByParentId = {} as Record<string, Event[]>
    const reactionsByParentId = {} as Record<string, Event[]>
    const repliesByParentId = {} as Record<string, Event[]>

    for (const event of this.data.get().concat(notes)) {
      if (contextById[event.id]) {
        continue
      }

      contextById[event.id] = event

      const parentId = findReplyId(event)

      if (event.kind === 9735) {
        pushToKey(zapsByParentId, parentId, event)
      } else if (event.kind === 7) {
        pushToKey(reactionsByParentId, parentId, event)
      } else {
        pushToKey(repliesByParentId, parentId, event)
      }
    }

    const annotate = (note: Event): DisplayEvent => {
      const {replies = [], reactions = [], zaps = []} = note as DisplayEvent
      const combinedZaps = zaps.concat(zapsByParentId[note.id] || [])
      const combinedReactions = reactions.concat(reactionsByParentId[note.id] || [])
      const combinedReplies = (replies as Event[])
        .concat(repliesByParentId[note.id] || [])
        .map(annotate)

      return {
        ...note,
        zaps: uniqBy(prop("id"), combinedZaps),
        reactions: uniqBy(prop("id"), combinedReactions),
        replies: sortBy((e: DisplayEvent) => -e.created_at, uniqBy(prop("id"), combinedReplies)),
        matchesFilter:
          !alreadySeen.has(note.id) &&
          (this.matchFilters(note) || Boolean(find(prop("matchesFilter"), combinedReplies))),
      }
    }

    if (substituteParents) {
      // We may have loaded a reply from a follower to someone we muted
      notes = reject(
        (e: Event) => isEventMuted(e).get(),
        notes.map(note => {
          for (let i = 0; i < 2; i++) {
            const parent = contextById[findReplyId(note)]

            if (!parent) {
              break
            }

            note = parent
          }

          return note
        })
      )
    }

    return uniqBy(prop("id"), notes).map(annotate)
  }

  // Context loaders

  loadPubkeys = (events: Event[]) => {
    loadPubkeys(
      events.filter(this.isTextNote).flatMap((e: Event) => Tags.from(e).pubkeys().concat(e.pubkey))
    )
  }

  loadParents = (events: Event[]) => {
    if (this.stopped) {
      return
    }

    const parentsInfo = events.flatMap((e: Event) => {
      const info = []
      const {root, reply} = findReplyAndRootIds(e)

      if (reply && !this.seen.has(reply)) {
        info.push({id: reply, hints: getParentHints(e)})
      }

      if (root && !this.seen.has(root)) {
        info.push({id: findRootId(e), hints: getRootHints(e)})
      }

      return info
    })

    if (parentsInfo.length > 0) {
      load({
        filters: getIdFilters(pluck("id", parentsInfo)),
        relays: this.mergeHints(pluck("hints", parentsInfo)),
        onEvent: batch(100, (context: Event[]) => this.addContext(context, {depth: 2})),
      })
    }
  }

  loadContext = batch(300, (eventGroups: any) => {
    if (this.stopped) {
      return
    }

    const groupsByDepth = groupBy(prop("depth"), eventGroups)

    for (const [depthStr, groups] of Object.entries(groupsByDepth)) {
      const depth = parseInt(depthStr)

      if (depth === 0) {
        continue
      }

      const events = uniqBy(
        prop("id"),
        flatten(pluck("events", groups as any[])).filter(this.isTextNote)
      ) as Event[]

      for (const c of chunk(256, events)) {
        load({
          relays: this.mergeHints(c.map(e => getReplyHints(e))),
          filters: [{kinds: this.getReplyKinds(), "#e": pluck("id", c as Event[])}],
          onEvent: batch(100, (context: Event[]) => this.addContext(context, {depth: depth - 1})),
        })
      }
    }
  })

  listenForContext = throttle(10_000, () => {
    if (this.stopped) {
      return
    }

    this.subs.forEach(sub => sub.close())

    const contextByParentId = groupBy(findReplyId, this.data.get())

    const findNotes = (events: Event[]): Event[] =>
      uniqBy(
        prop("id"),
        events
          .filter(this.isTextNote)
          .flatMap(e => findNotes(contextByParentId[e.id] || []).concat(e))
      )

    for (const c of chunk(256, findNotes(this.data.get()))) {
      this.addSubs([
        subscribe({
          relays: this.mergeHints(c.map(e => getReplyHints(e))),
          filters: [{kinds: this.getReplyKinds(), "#e": pluck("id", c), since: now()}],
          onEvent: batch(100, (context: Event[]) => this.addContext(context, {depth: 2})),
        }),
      ])
    }
  })

  // Adders

  addContext = (newEvents: Event[], {shouldLoadParents = false, depth = 0}) => {
    const events = this.preprocessEvents(newEvents)

    this.data.update($context => $context.concat(events))

    this.loadPubkeys(events)

    if (shouldLoadParents) {
      this.loadParents(events)
    }

    this.loadContext({events, depth})

    this.listenForContext()

    if (this.opts.onEvent) {
      for (const event of events) {
        this.opts.onEvent(event)
      }
    }
  }

  hydrate(notes: Partial<DisplayEvent>[], depth) {
    const context: Event[] = []

    const addContext = (note: Partial<DisplayEvent>) => {
      // Only add to context if it's a real event
      if (note.sig) {
        context.push(fromDisplayEvent(note as DisplayEvent))
      }

      note.zaps?.forEach(zap => context.push(zap))
      note.reactions?.forEach(reaction => context.push(reaction))
      note.replies?.forEach(reply => addContext(reply))
    }

    notes.forEach(addContext)

    this.addContext(context, {depth})
  }

  // Control

  stop() {
    this.stopped = true

    for (const sub of this.subs) {
      sub.close()
    }
  }
}
