import {derived} from "svelte/store"
import {nth, identity, partition, first} from "@welshman/lib"
import {Repository, Relay, matchFilters, getIdAndAddress, getIdFilters} from "@welshman/util"
import type {Filter, TrustedEvent} from "@welshman/util"
import {custom} from "src/util/misc"

export const repository = new Repository({throttle: 300})

export const relay = new Relay(repository)

// Sync to/from repository via a custom store
export const events = {
  _subs: [],
  _onUpdate: () => {
    const $events = repository.dump()

    for (const sub of events._subs) {
      sub($events)
    }
  },
  get: () => repository.dump(),
  set: (events: TrustedEvent[]) => repository.load(events),
  subscribe: f => {
    events._subs.push(f)

    if (events._subs.length === 1) {
      repository.on("update", events._onUpdate)
    }

    return () => {
      events._subs = events._subs.filter(x => x !== f)

      if (events._subs.length === 0) {
        repository.off("update", events._onUpdate)
      }
    }
  },
}

export const deriveEventsMapped = <T>({
  filters,
  eventToItem,
  itemToEvent,
  includeDeleted = false,
}: {
  filters: Filter[]
  eventToItem: (event: TrustedEvent) => T
  itemToEvent: (item: T) => TrustedEvent
  includeDeleted?: boolean
}) =>
  custom<T[]>(setter => {
    let data = setter(repository.query(filters, {includeDeleted}).map(eventToItem).filter(identity))

    const onEvent = (event: TrustedEvent) => {
      if (matchFilters(filters, event)) {
        const item = eventToItem(event)

        if (item) {
          data = setter([...data, item])
        }
      }
    }

    const onDelete = (event: TrustedEvent) => {
      const ids = new Set(event.tags.map(nth(1)))
      const [deleted, ok] = partition(
        (item: T) => getIdAndAddress(itemToEvent(item)).some(id => ids.has(id)),
        data,
      )

      if (deleted.length > 0) {
        data = setter(ok)
      }
    }

    repository.on("event", onEvent)

    if (!includeDeleted) {
      repository.on("delete", onDelete)
    }

    return () => {
      repository.off("event", onEvent)

      if (!includeDeleted) {
        repository.off("delete", onDelete)
      }
    }
  })

export const deriveEvents = (opts: {filters: Filter[]; includeDeleted?: boolean}) =>
  deriveEventsMapped<TrustedEvent>({...opts, eventToItem: identity, itemToEvent: identity})

export const deriveEvent = (idOrAddress: string) =>
  derived(deriveEvents({filters: getIdFilters([idOrAddress]), includeDeleted: true}), first)
