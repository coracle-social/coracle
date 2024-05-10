import {debounce} from "throttle-debounce"
import {always} from "ramda"
import {noop, sleep} from "hurdak"
import {writable} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {load} from "src/engine/network/utils"
import {searchableRelays} from "src/engine/relays/derived"

type PeopleLoaderOpts = {
  shouldLoad?: (term: string) => boolean
  onEvent?: (e: TrustedEvent) => void
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
