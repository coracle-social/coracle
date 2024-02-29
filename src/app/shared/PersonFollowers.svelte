<script lang="ts">
  import {onMount} from "svelte"
  import {uniq, pluck} from "ramda"
  import {batch} from "hurdak"
  import {createScroller} from "src/util/misc"
  import {getModal} from "src/partials/state"
  import PersonList from "src/app/shared/PersonList.svelte"
  import type {Event} from "src/engine"
  import {subscribe, loadPubkeys, hints} from "src/engine"

  export let pubkey

  let limit = 20
  let pubkeys = []

  const loadMore = async () => {
    limit += 20
  }

  onMount(() => {
    const scroller = createScroller(loadMore, {element: getModal()})
    const sub = subscribe({
      relays: hints.FetchFromPubkey(pubkey).getUrls(),
      filters: [{kinds: [3], "#p": [pubkey]}],
      onEvent: batch(500, (events: Event[]) => {
        const newPubkeys = pluck("pubkey", events)

        loadPubkeys(newPubkeys)

        pubkeys = uniq(pubkeys.concat(newPubkeys))
      }),
    })

    return () => {
      sub.close()
      scroller.stop()
    }
  })
</script>

<PersonList {pubkeys} />
