import {partition, pluck, sortBy, omit, without, any, prop, assoc} from "ramda"
import {ensurePlural, seconds, doPipe, sleep, throttle, batch} from "hurdak"
import {now, race} from "src/util/misc"
import {Cursor, MultiCursor} from "src/engine/util/Cursor"
import {PubkeyLoader} from "src/engine/util/PubkeyLoader"
import {ContextLoader} from "src/engine/util/ContextLoader"
import {writable} from "src/engine/util/store"
import type {Subscription} from "src/engine/util/Subscription"
import type {Event, DisplayEvent, Filter} from "src/engine/types"
import type {Engine} from "src/engine/Engine"

const fromDisplayEvent = (e: DisplayEvent): Event =>
  omit(["zaps", "likes", "replies", "matchesFilter"], e)

export type FeedOpts = {
  depth: number
  relays: string[]
  filter: Filter | Filter[]
  onEvent?: (e: Event) => void
  shouldLoadParents?: boolean
}

export class FeedLoader {
  engine: Engine
  pubkeyLoader: PubkeyLoader
  since = now()
  stopped = false
  context: ContextLoader
  subs: Array<{close: () => void}> = []
  feed = writable<DisplayEvent[]>([])
  deferred: Event[] = []
  cursor: MultiCursor
  ready: Promise<void>

  constructor(engine: Engine, readonly opts: FeedOpts) {
    this.engine = engine

    this.pubkeyLoader = new PubkeyLoader(engine)

    this.context = new ContextLoader(engine, {
      filter: opts.filter,
      onEvent: event => {
        opts.onEvent?.(event)

        this.updateFeed()
      },
      shouldLoadParents: opts.shouldLoadParents,
    })

    // No point in subscribing if we have an end date
    if (!any(prop("until"), ensurePlural(opts.filter) as any[])) {
      this.addSubs([
        this.engine.Network.subscribe({
          relays: opts.relays,
          filter: ensurePlural(opts.filter).map(assoc("since", this.since)),
          onEvent: batch(1000, (context: Event[]) =>
            this.context.addContext(context, {shouldLoadParents: true, depth: opts.depth})
          ),
        }),
      ])
    }

    this.cursor = new MultiCursor(
      opts.relays.map(
        relay =>
          new Cursor(this.engine, {
            relay,
            filter: opts.filter,
            onEvent: batch(100, (context: Event[]) =>
              this.context.addContext(context, {shouldLoadParents: true, depth: opts.depth})
            ),
          })
      )
    )

    const subs = this.cursor.load(50)

    this.addSubs(subs)

    // Wait until a good number of subscriptions have completed to reduce the chance of
    // out of order notes
    this.ready = race(0.5, pluck("complete", subs))
  }

  // Control

  addSubs(subs: Array<Subscription>) {
    for (const sub of ensurePlural(subs)) {
      this.subs.push(sub)

      sub.on("close", () => {
        this.subs = without([sub], this.subs)
      })
    }
  }

  stop() {
    this.stopped = true
    this.context.stop()

    for (const sub of this.subs) {
      sub.close()
    }
  }

  // Feed building

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

    this.context.addContext(context, {depth})
  }

  addToFeed = (notes: Event[]) => {
    this.feed.update($feed => {
      const newFeed = ($feed as Event[]).concat(sortBy(e => -e.created_at, notes))

      return this.context.applyContext(newFeed, true)
    })
  }

  updateFeed = throttle(500, () => {
    this.feed.update($feed => this.context.applyContext($feed, true))
  })

  // Loading

  async load(n) {
    await this.ready

    const [subs, notes] = this.cursor.take(n)
    const deferred = this.deferred.splice(0)

    this.addSubs(subs)

    const ok = doPipe(notes.concat(deferred), [
      this.deferReactions,
      this.deferOrphans,
      this.deferAncient,
    ])

    this.addToFeed(ok)
  }

  async loadAll() {
    this.addSubs(this.cursor.load(Infinity))

    // Wait for our requested notes
    while (!this.cursor.done()) {
      this.load(20)

      await sleep(300)
    }
  }

  deferReactions = (notes: Event[]) => {
    const [defer, ok] = partition(
      e => !this.context.isTextNote(e) && this.context.isMissingParent(e),
      notes
    )

    setTimeout(() => {
      // Defer again if we still don't have a parent, it's pointless to show an orphaned reaction
      const [orphans, ready] = partition(this.context.isMissingParent, defer)

      this.addToFeed(ready)
      this.deferred = this.deferred.concat(orphans)
    }, 1500)

    return ok
  }

  deferOrphans = (notes: Event[]) => {
    // If something has a parent id but we haven't found the parent yet, skip it until we have it.
    const [defer, ok] = partition(
      e => this.context.isTextNote(e) && this.context.isMissingParent(e),
      notes
    )

    setTimeout(() => this.addToFeed(defer), 1500)

    return ok
  }

  deferAncient = (notes: Event[]) => {
    // Sometimes relays send very old data very quickly. Pop these off the queue and re-add
    // them after we have more timely data. They still might be relevant, but order will still
    // be maintained since everything before the cutoff will be deferred the same way.
    const since = now() - seconds(6, "hour")
    const [defer, ok] = partition(e => e.created_at < since, notes)

    setTimeout(() => this.addToFeed(defer), 4000)

    return ok
  }
}
