import {matchFilters} from "nostr-tools"
import {throttle} from "throttle-debounce"
import {
  map,
  omit,
  pick,
  pluck,
  partition,
  identity,
  flatten,
  without,
  groupBy,
  any,
  sortBy,
  prop,
  uniqBy,
  assoc,
  reject,
} from "ramda"
import {ensurePlural, seconds, sleep, batch, union, chunk, doPipe} from "hurdak"
import {now, pushToKey} from "src/util/misc"
import {findReplyId, Tags, noteKinds} from "src/util/nostr"
import {collection} from "./store"
import {Cursor, MultiCursor} from "src/engine/util/Cursor"
import type {Collection} from "src/engine/util/store"
import type {Subscription} from "src/engine/util/Subscription"
import type {Event, DisplayEvent, Filter} from "src/engine/types"
import type {Engine} from "src/engine/Engine"

const fromDisplayEvent = (e: DisplayEvent): Event =>
  omit(["zaps", "likes", "replies", "matchesFilter"], e)

export type FeedOpts = {
  limit?: number
  depth: number
  relays: string[]
  filter: Filter | Filter[]
  onEvent?: (e: Event) => void
  shouldLoadParents?: boolean
  engine: Engine
}

export class Feed {
  limit: number
  since: number
  started: boolean
  stopped: boolean
  deferred: Event[]
  context: Collection<Event>
  feed: Collection<DisplayEvent>
  seen: Set<string>
  subs: Record<string, Array<{close: () => void}>>
  cursor: MultiCursor

  constructor(readonly opts: FeedOpts) {
    this.limit = opts.limit || 20
    this.since = now()
    this.started = false
    this.stopped = false
    this.deferred = []
    this.context = collection<Event>("id")
    this.feed = collection<DisplayEvent>("id")
    this.seen = new Set()
    this.subs = {
      main: [],
      notes: [],
      context: [],
      listeners: [],
    }
  }

  // Utils

  addSubs(key: string, subs: Array<Subscription>) {
    for (const sub of ensurePlural(subs)) {
      this.subs[key].push(sub)

      sub.on("close", () => {
        this.subs[key] = without([sub], this.subs[key])
      })
    }
  }

  getAllSubs(only: string[] = []) {
    return flatten(Object.values(only ? pick(only, this.subs) : this.subs))
  }

  getReplyKinds() {
    return this.opts.engine.Env.ENABLE_ZAPS ? [1, 7, 9735] : [1, 7]
  }

  matchFilters(e: Event) {
    return matchFilters(ensurePlural(this.opts.filter), e)
  }

  isTextNote(e: Event) {
    return noteKinds.includes(e.kind)
  }

  isMissingParent = (e: Event) => {
    const parentId = findReplyId(e)

    return parentId && this.matchFilters(e) && !this.context.key(parentId).exists()
  }

  preprocessEvents = (events: Event[]) => {
    const {User} = this.opts.engine

    events = reject((e: Event) => this.seen.has(e.id) || User.isMuted(e), events)

    for (const event of events) {
      this.seen.add(event.id)
    }

    return events
  }

  mergeHints(groups: string[][]) {
    const {Nip65, User} = this.opts.engine

    return Nip65.mergeHints(User.getSetting("relay_limit"), groups)
  }

  applyContext(notes: Event[], context: Event[], substituteParents = false) {
    const parentIds = new Set(notes.map(findReplyId).filter(identity))
    const forceShow = union(new Set(pluck("id", notes)), parentIds)
    const contextById = {} as Record<string, Event>
    const zapsByParentId = {} as Record<string, Event[]>
    const reactionsByParentId = {} as Record<string, Event[]>
    const repliesByParentId = {} as Record<string, Event[]>

    for (const event of context.concat(notes)) {
      const parentId = findReplyId(event)

      if (contextById[event.id]) {
        continue
      }

      contextById[event.id] = event

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
      const combinedReplies = replies.concat(map(annotate, repliesByParentId[note.id] || []))

      return {
        ...note,
        zaps: uniqBy(prop("id"), combinedZaps),
        reactions: uniqBy(prop("id"), combinedReactions),
        replies: sortBy((e: DisplayEvent) => -e.created_at, uniqBy(prop("id"), combinedReplies)),
        matchesFilter: forceShow.has(note.id) || this.matchFilters(note),
      }
    }

    return notes.map(note => {
      if (substituteParents) {
        for (let i = 0; i < 3; i++) {
          const parent = contextById[findReplyId(note)]

          if (!parent) {
            break
          }

          note = parent
        }
      }

      return annotate(note)
    })
  }

  // Context loaders

  loadPubkeys = (events: Event[]) => {
    this.opts.engine.PubkeyLoader.load(
      events.filter(this.isTextNote).flatMap((e: Event) => Tags.from(e).pubkeys().concat(e.pubkey))
    )
  }

  loadParents = (events: Event[]) => {
    const {Network, Nip65} = this.opts.engine
    const parentsInfo = events
      .map((e: Event) => ({id: findReplyId(e), hints: Nip65.getParentHints(10, e)}))
      .filter(({id}: any) => id && !this.seen.has(id))

    if (parentsInfo.length > 0) {
      this.addSubs("context", [
        Network.subscribe({
          timeout: 3000,
          filter: {ids: pluck("id", parentsInfo)},
          relays: this.mergeHints(pluck("hints", parentsInfo)),
          onEvent: batch(100, (context: Event[]) => this.addContext(context, {depth: 2})),
        }),
      ])
    }
  }

  loadContext = batch(300, (eventGroups: any) => {
    const {Network, Nip65} = this.opts.engine
    const groupsByDepth = groupBy(prop("depth"), eventGroups)

    for (const [depthStr, groups] of Object.entries(groupsByDepth)) {
      const depth = parseInt(depthStr)

      if (depth === 0) {
        continue
      }

      const events = flatten(pluck("events", groups as any[])).filter(this.isTextNote) as Event[]

      for (const c of chunk(256, events)) {
        Network.subscribe({
          timeout: 3000,
          relays: this.mergeHints(c.map(e => Nip65.getReplyHints(10, e))),
          filter: {kinds: this.getReplyKinds(), "#e": pluck("id", c as Event[])},

          onEvent: batch(100, (context: Event[]) => this.addContext(context, {depth: depth - 1})),
        })
      }
    }
  })

  listenForContext = throttle(5000, () => {
    const {Network, Nip65} = this.opts.engine

    if (this.stopped) {
      return
    }

    this.subs.listeners.forEach(sub => sub.close())

    const contextByParentId = groupBy(findReplyId, this.context.get())

    const findNotes = (events: Event[]): Event[] =>
      events
        .filter(this.isTextNote)
        .flatMap(e => findNotes(contextByParentId[e.id] || []).concat(e))

    for (const c of chunk(256, findNotes(this.feed.get()))) {
      this.addSubs("listeners", [
        Network.subscribe({
          relays: this.mergeHints(c.map(e => Nip65.getReplyHints(10, e))),
          filter: {kinds: this.getReplyKinds(), "#e": pluck("id", c), since: now()},
          onEvent: batch(100, (context: Event[]) => this.addContext(context, {depth: 2})),
        }),
      ])
    }
  })

  // Adders

  addContext = (newEvents: Event[], {shouldLoadParents = false, depth = 0}) => {
    const events = this.preprocessEvents(newEvents)

    if (this.opts.onEvent) {
      for (const event of events) {
        this.opts.onEvent(event)
      }
    }

    this.feed.update($feed => this.applyContext($feed, events, false))

    this.context.update($context => $context.concat(events))

    this.loadPubkeys(events)

    if (this.opts.shouldLoadParents && shouldLoadParents) {
      this.loadParents(events)
    }

    this.loadContext({events, depth})

    this.listenForContext()
  }

  // Control

  start() {
    const {since} = this
    const {relays, filter, engine, depth} = this.opts

    // No point in subscribing if we have an end date
    if (!any(prop("until"), ensurePlural(filter) as any[])) {
      this.addSubs("main", [
        engine.Network.subscribe({
          relays,
          filter: ensurePlural(filter).map(assoc("since", since)),
          onEvent: batch(1000, (context: Event[]) =>
            this.addContext(context, {shouldLoadParents: true, depth})
          ),
        }),
      ])
    }

    this.cursor = new MultiCursor(
      relays.map(
        relay =>
          new Cursor({
            relay,
            filter,
            Network: engine.Network,
            onEvent: batch(100, (context: Event[]) =>
              this.addContext(context, {shouldLoadParents: true, depth})
            ),
          })
      )
    )

    this.started = true
  }

  stop() {
    this.stopped = true

    for (const sub of this.getAllSubs()) {
      sub.close()
    }
  }

  hydrate(feed: DisplayEvent[]) {
    const {depth} = this.opts
    const notes: DisplayEvent[] = []
    const context: Event[] = []

    const addContext = (note: DisplayEvent) => {
      context.push(fromDisplayEvent(note))

      note.zaps.forEach(zap => context.push(zap))
      note.reactions.forEach(reaction => context.push(reaction))
      note.replies.forEach(reply => addContext(reply))
    }

    feed.forEach(note => {
      addContext(note)
      notes.push(note)
    })

    this.feed.set(notes)
    this.addContext(context, {depth})
  }

  // Loading

  async load() {
    if (!this.started) {
      this.start()
    }

    // If we don't have a decent number of notes yet, try to get enough
    // to avoid out of order notes
    if (this.cursor.count() < this.limit) {
      this.addSubs("notes", this.cursor.load(this.limit))

      await sleep(500)
    }

    const [subs, notes] = this.cursor.take(5)
    const deferred = this.deferred.splice(0)

    this.addSubs("notes", subs)

    const ok = doPipe(notes.concat(deferred), [
      this.deferReactions,
      this.deferOrphans,
      this.deferAncient,
    ])

    this.addToFeed(ok)
  }

  async loadAll() {
    if (!this.started) {
      this.start()
    }

    this.addSubs("notes", this.cursor.load(this.limit))

    // Wait for our requested notes
    while (!this.cursor.done()) {
      const [subs, notes] = this.cursor.take(this.limit)

      this.addSubs("notes", subs)
      this.addToFeed(notes)

      await sleep(300)
    }

    // Wait for our requested context
    while (this.getAllSubs(["notes", "context"]).length > 0) {
      await sleep(300)
    }
  }

  deferReactions = (notes: Event[]) => {
    const [defer, ok] = partition(e => !this.isTextNote(e) && this.isMissingParent(e), notes)

    setTimeout(() => {
      // Defer again if we still don't have a parent, it's pointless to show an orphaned reaction
      const [orphans, ready] = partition(this.isMissingParent, defer)

      this.addToFeed(ready)
      this.deferred = this.deferred.concat(orphans)
    }, 1500)

    return ok
  }

  deferOrphans = (notes: Event[]) => {
    // If something has a parent id but we haven't found the parent yet, skip it until we have it.
    const [defer, ok] = partition(e => this.isTextNote(e) && this.isMissingParent(e), notes)

    setTimeout(() => this.addToFeed(defer), 1500)

    return ok
  }

  deferAncient = (notes: Event[]) => {
    // Sometimes relays send very old data very quickly. Pop these off the queue and re-add
    // them after we have more timely data. They still might be relevant, but order will still
    // be maintained since everything before the cutoff will be deferred the same way.
    const since = now() - seconds(6, "hour")
    const [defer, ok] = partition(e => e.created_at < since, notes)

    setTimeout(() => this.addToFeed(defer), 1500)

    return ok
  }

  addToFeed(notes: Event[]) {
    const context = this.context.get()
    const applied = this.applyContext(notes, context, true)
    const sorted = sortBy(e => -e.created_at, applied)

    this.feed.update($feed => $feed.concat(sorted))
  }
}
