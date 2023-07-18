import {matchFilters} from "nostr-tools"
import {throttle} from "throttle-debounce"
import {
  omit,
  pluck,
  partition,
  identity,
  flatten,
  without,
  groupBy,
  all,
  sortBy,
  prop,
  uniqBy,
  assoc,
  reject,
} from "ramda"
import {ensurePlural, chunk, doPipe} from "hurdak/lib/hurdak"
import {batch, timedelta, union, sleep, now} from "src/util/misc"
import {findReplyId, Tags, noteKinds} from "src/util/nostr"
import {collection} from "./store"
import type {Collection} from "./store"
import {Cursor, MultiCursor} from "./Cursor"
import type {Event, DisplayEvent, Filter} from "../types"

const fromDisplayEvent = omit(["zaps", "likes", "replies", "matchesFilter"])

export type FeedOpts = {
  limit?: number
  depth: number
  relays: string[]
  filter: Filter | Filter[]
  onEvent?: (e: Event) => void
  engine: any
}

export class Feed {
  limit: number
  since: number
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

  addSubs(key, subs) {
    for (const sub of ensurePlural(subs)) {
      this.subs[key].push(sub)

      sub.on("close", () => {
        this.subs[key] = without([sub], this.subs[key])
      })
    }
  }

  getReplyKinds() {
    return this.opts.engine.Env.ENABLE_ZAPS ? [1, 7, 9735] : [1, 7]
  }

  matchFilters(e) {
    return matchFilters(ensurePlural(this.opts.filter), e)
  }

  isTextNote(e) {
    return noteKinds.includes(e.kind)
  }

  isMissingParent = e => {
    const parentId = findReplyId(e)

    return parentId && this.matchFilters(e) && !this.context.key(parentId).exists()
  }

  preprocessEvents = events => {
    events = reject(e => this.seen.has(e.id), events)

    for (const event of events) {
      this.seen.add(event.id)
    }

    return events
  }

  mergeHints(groups) {
    const {Nip65, User} = this.opts.engine

    return Nip65.mergeHints(User.getSetting("relay_limit"), groups)
  }

  applyContext(notes, context, substituteParents = false) {
    const parentIds = new Set(notes.map(findReplyId).filter(identity))
    const forceShow = union(new Set(pluck("id", notes)), parentIds)
    const contextById = {}
    const zapsByParentId = {}
    const reactionsByParentId = {}
    const repliesByParentId = {}

    for (const event of context.concat(notes)) {
      const parentId = findReplyId(event)

      if (contextById[event.id]) {
        continue
      }

      contextById[event.id] = event

      if (event.kind === 9735) {
        zapsByParentId[parentId] = zapsByParentId[parentId] || []
        zapsByParentId[parentId].push(event)
      } else if (event.kind === 7) {
        reactionsByParentId[parentId] = reactionsByParentId[parentId] || []
        reactionsByParentId[parentId].push(event)
      } else {
        repliesByParentId[parentId] = repliesByParentId[parentId] || []
        repliesByParentId[parentId].push(event)
      }
    }

    const annotate = (note: DisplayEvent) => {
      const {replies = [], reactions = [], zaps = []} = note
      const combinedZaps = zaps.concat(zapsByParentId[note.id] || [])
      const combinedReactions = reactions.concat(reactionsByParentId[note.id] || [])
      const combinedReplies = replies.concat(repliesByParentId[note.id] || [])

      return {
        ...note,
        zaps: uniqBy(prop("id"), combinedZaps),
        reactions: uniqBy(prop("id"), combinedReactions),
        replies: sortBy(e => -e.created_at, uniqBy(prop("id"), combinedReplies.map(annotate))),
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

  loadPubkeys = events => {
    this.opts.engine.PubkeyLoader.load(
      events.filter(this.isTextNote).flatMap(e => Tags.from(e).pubkeys().concat(e.pubkey))
    )
  }

  loadParents = events => {
    const {Network, Nip65} = this.opts.engine
    const parentsInfo = events
      .map(e => ({id: findReplyId(e), hints: Nip65.getParentHints(3, e)}))
      .filter(({id}) => id && !this.seen.has(id))

    if (parentsInfo.length > 0) {
      this.addSubs("context", [
        Network.subscribe({
          autoClose: true,
          filter: {ids: pluck("id", parentsInfo)},
          relays: this.mergeHints(pluck("hints", parentsInfo)),
          onEvent: batch(100, context => this.addContext(context, {depth: 2})),
        }),
      ])
    }
  }

  loadContext = batch(300, eventGroups => {
    const {Network, Nip65} = this.opts.engine
    const groupsByDepth = groupBy(prop("depth"), eventGroups)

    for (const [depthStr, groups] of Object.entries(groupsByDepth)) {
      const depth = parseInt(depthStr)

      if (depth === 0) {
        continue
      }

      const events = flatten(pluck("events", groups)).filter(this.isTextNote)

      for (const c of chunk(256, events)) {
        Network.subscribe({
          autoClose: true,
          relays: this.mergeHints(c.map(e => Nip65.getReplyHints(3, e))),
          filter: {kinds: this.getReplyKinds(), "#e": pluck("id", c)},
          onEvent: batch(100, context => this.addContext(context, {depth: depth - 1})),
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

    const findNotes = events =>
      events
        .filter(this.isTextNote)
        .flatMap(e => findNotes(contextByParentId[e.id] || []).concat(e))

    for (const c of chunk(256, findNotes(this.feed.get()))) {
      this.addSubs("listeners", [
        Network.subscribe({
          relays: this.mergeHints(c.map(e => Nip65.getReplyHints(3, e))),
          filter: {kinds: this.getReplyKinds(), "#e": pluck("id", c), since: now()},
          onEvent: batch(100, context => this.addContext(context, {depth: 2})),
        }),
      ])
    }
  })

  // Adders

  addContext = (newEvents, {shouldLoadParents = false, depth = 0}) => {
    const {onEvent} = this.opts
    const events = this.preprocessEvents(newEvents)

    if (onEvent) {
      for (const event of events) {
        onEvent(event)
      }
    }

    this.feed.update($feed => this.applyContext($feed, events, false))

    this.context.update($context => $context.concat(events))

    this.loadPubkeys(events)

    if (shouldLoadParents) {
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
    if (!all(prop("until"), ensurePlural(filter))) {
      this.addSubs("main", [
        engine.Network.subscribe({
          relays,
          filter: ensurePlural(filter).map(assoc("since", since)),
          onEvent: batch(1000, context =>
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
            subscribe: engine.Network.subscribe,
            onEvent: batch(100, context =>
              this.addContext(context, {shouldLoadParents: true, depth})
            ),
          })
      )
    )

    // Load the first page as soon as possible
    this.addSubs("notes", this.cursor.load(this.limit))
  }

  stop() {
    this.stopped = true

    for (const sub of flatten(Object.values(this.subs))) {
      sub.close()
    }
  }

  hydrate(feed) {
    const {depth} = this.opts
    const notes = []
    const context = []

    const addContext = ({zaps, replies, reactions, ...note}) => {
      context.push(fromDisplayEvent(note))

      zaps.map(zap => context.push(zap))
      reactions.map(reaction => context.push(reaction))

      replies.map(addContext)
    }

    feed.forEach(note => {
      addContext(note)

      notes.push(fromDisplayEvent(note))
    })

    this.feed.set(notes)
    this.addContext(context, {depth})
  }

  // Loading

  async load() {
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
    while (!this.cursor.done()) {
      await this.load()
    }
  }

  deferReactions = notes => {
    const [defer, ok] = partition(e => !this.isTextNote(e) && this.isMissingParent(e), notes)

    setTimeout(() => {
      // Defer again if we still don't have a parent, it's pointless to show an orphaned reaction
      const [orphans, ready] = partition(this.isMissingParent, defer)

      this.addToFeed(ready)
      this.deferred = this.deferred.concat(orphans)
    }, 1500)

    return ok
  }

  deferOrphans = notes => {
    // If something has a parent id but we haven't found the parent yet, skip it until we have it.
    const [defer, ok] = partition(e => this.isTextNote(e) && this.isMissingParent(e), notes)

    setTimeout(() => this.addToFeed(defer), 1500)

    return ok
  }

  deferAncient = notes => {
    // Sometimes relays send very old data very quickly. Pop these off the queue and re-add
    // them after we have more timely data. They still might be relevant, but order will still
    // be maintained since everything before the cutoff will be deferred the same way.
    const since = now() - timedelta(6, "hours")
    const [defer, ok] = partition(e => e.created_at < since, notes)

    setTimeout(() => this.addToFeed(defer), 1500)

    return ok
  }

  addToFeed(notes) {
    const context = this.context.get()
    const applied = this.applyContext(notes, context, true)
    const sorted = sortBy(e => -e.created_at, applied)

    this.feed.update($feed => $feed.concat(sorted))
  }
}
