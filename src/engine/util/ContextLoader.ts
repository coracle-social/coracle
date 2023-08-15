import {matchFilters} from "nostr-tools"
import {throttle} from "throttle-debounce"
import {omit, pluck, identity, flatten, without, groupBy, sortBy, prop, uniqBy, reject} from "ramda"
import {ensurePlural, batch, union, chunk} from "hurdak"
import {now, pushToKey} from "src/util/misc"
import {findReplyId, Tags, noteKinds} from "src/util/nostr"
import {collection} from "./store"
import {PubkeyLoader} from "src/engine/util/PubkeyLoader"
import type {Collection} from "src/engine/util/store"
import type {Subscription} from "src/engine/util/Subscription"
import type {Event, DisplayEvent, Filter} from "src/engine/types"
import type {Engine} from "src/engine/Engine"

const fromDisplayEvent = (e: DisplayEvent): Event =>
  omit(["zaps", "likes", "replies", "matchesFilter"], e)

export type ContextLoaderOpts = {
  isMuted: (e: Event) => boolean
  filter?: Filter | Filter[]
  onEvent?: (e: Event) => void
  shouldLoadParents?: boolean
}

export class ContextLoader {
  engine: Engine
  pubkeyLoader: PubkeyLoader
  stopped: boolean
  data: Collection<Event>
  seen: Set<string>
  subs: Record<string, Array<{close: () => void}>>

  constructor(engine: Engine, readonly opts: ContextLoaderOpts) {
    this.engine = engine
    this.pubkeyLoader = new PubkeyLoader(engine)
    this.stopped = false
    this.data = collection<Event>("id")
    this.seen = new Set()
    this.subs = {
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

  getAllSubs() {
    return flatten(Object.values(this.subs))
  }

  getReplyKinds() {
    return this.engine.Env.ENABLE_ZAPS ? [1, 7, 9735] : [1, 7]
  }

  matchFilters(e: Event) {
    return this.opts.filter && matchFilters(ensurePlural(this.opts.filter), e)
  }

  isTextNote(e: Event) {
    return noteKinds.includes(e.kind)
  }

  isMissingParent = (e: Event) => {
    const parentId = findReplyId(e)

    return parentId && this.matchFilters(e) && !this.data.key(parentId).exists()
  }

  preprocessEvents = (events: Event[]) => {
    events = reject((e: Event) => this.seen.has(e.id) || this.opts.isMuted(e), events)

    for (const event of events) {
      this.seen.add(event.id)
    }

    return events
  }

  getRelayLimit() {
    return this.engine.Settings.getSetting("relay_limit")
  }

  mergeHints(groups: string[][]) {
    return this.engine.Nip65.mergeHints(this.getRelayLimit(), groups)
  }

  applyContext = (notes: Event[], substituteParents = false) => {
    const parentIds = new Set(notes.map(findReplyId).filter(identity))
    const forceShow = union(new Set(pluck("id", notes)), parentIds)
    const contextById = {} as Record<string, Event>
    const zapsByParentId = {} as Record<string, Event[]>
    const reactionsByParentId = {} as Record<string, Event[]>
    const repliesByParentId = {} as Record<string, Event[]>

    for (const event of this.data.get()) {
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
        matchesFilter: forceShow.has(note.id) || this.matchFilters(note),
      }
    }

    if (substituteParents) {
      // We may have loaded a reply from a follower to someone we muted
      notes = reject(
        this.opts.isMuted,
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
    this.pubkeyLoader.load(
      events.filter(this.isTextNote).flatMap((e: Event) => Tags.from(e).pubkeys().concat(e.pubkey))
    )
  }

  loadParents = (events: Event[]) => {
    if (this.stopped) {
      return
    }

    const {Network, Nip65} = this.engine
    const parentsInfo = events
      .map((e: Event) => ({
        id: findReplyId(e),
        hints: Nip65.getParentHints(this.getRelayLimit(), e),
      }))
      .filter(({id}: any) => id && !this.seen.has(id))

    if (parentsInfo.length > 0) {
      this.addSubs("context", [
        Network.subscribe({
          timeout: 5000,
          filter: {ids: pluck("id", parentsInfo)},
          relays: this.mergeHints(pluck("hints", parentsInfo)),
          onEvent: batch(100, (context: Event[]) => this.addContext(context, {depth: 2})),
        }),
      ])
    }
  }

  loadContext = batch(300, (eventGroups: any) => {
    if (this.stopped) {
      return
    }

    const {Network, Nip65} = this.engine
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
        this.addSubs("context", [
          Network.subscribe({
            timeout: 5000,
            relays: this.mergeHints(c.map(e => Nip65.getReplyHints(this.getRelayLimit(), e))),
            filter: {kinds: this.getReplyKinds(), "#e": pluck("id", c as Event[])},
            onEvent: batch(100, (context: Event[]) => this.addContext(context, {depth: depth - 1})),
          }),
        ])
      }
    }
  })

  listenForContext = throttle(5000, () => {
    if (this.stopped) {
      return
    }

    const {Network, Nip65} = this.engine

    this.subs.listeners.forEach(sub => sub.close())

    const contextByParentId = groupBy(findReplyId, this.data.get())

    const findNotes = (events: Event[]): Event[] =>
      uniqBy(
        prop("id"),
        events
          .filter(this.isTextNote)
          .flatMap(e => findNotes(contextByParentId[e.id] || []).concat(e))
      )

    for (const c of chunk(256, findNotes(this.data.get()))) {
      this.addSubs("listeners", [
        Network.subscribe({
          relays: this.mergeHints(c.map(e => Nip65.getReplyHints(this.getRelayLimit(), e))),
          filter: {kinds: this.getReplyKinds(), "#e": pluck("id", c), since: now()},
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

    for (const sub of this.getAllSubs()) {
      sub.close()
    }
  }
}
