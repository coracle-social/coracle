import {debounce} from "throttle-debounce"
import {always} from "ramda"
import {noop, sleep} from "hurdak"
import {writable} from "@coracle.social/lib"
import {load} from "src/engine/network/utils"
import {searchableRelays} from "src/engine/relays/derived"
import type {Event} from "src/engine/events/model"

type PeopleLoaderOpts = {
  shouldLoad?: (term: string) => boolean
  onEvent?: (e: Event) => void
}

export const createPeopleLoader = ({
  shouldLoad = always(true),
  onEvent = noop,
}: PeopleLoaderOpts = {}) => {
  const loading = writable(false)

  return {
    loading,
    load: debounce(500, term => {
      if (term.length > 2 && shouldLoad(term)) {
        const now = Date.now()

        loading.set(true)

        load({
          onEvent,
          relays: searchableRelays.get(),
          filters: [{kinds: [0], search: term, limit: 100}],
          onComplete: async () => {
            await sleep(Math.min(1000, Date.now() - now))

            loading.set(false)
          },
        })
      }
    }),
  }
}
