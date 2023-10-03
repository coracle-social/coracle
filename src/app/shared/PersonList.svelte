<script lang="ts">
  import {onMount} from "svelte"
  import {uniq, pluck} from "ramda"
  import {batch} from "hurdak"
  import {Tags} from "src/util/nostr"
  import {createScroller} from "src/util/misc"
  import {getModal} from "src/partials/state"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import type {Event} from "src/engine"
  import {subscribe, loadPubkeys, getPubkeyHints} from "src/engine"

  export let type
  export let pubkey

  let limit = 20
  let pubkeys = []

  const loadMore = async () => {
    limit += 20
  }

  onMount(() => {
    const scroller = createScroller(loadMore, {element: getModal()})
    const sub =
      type === "follows"
        ? subscribe({
            relays: getPubkeyHints(pubkey, "read"),
            filters: [{kinds: [3], authors: [pubkey]}],
            onEvent: (e: Event) => {
              pubkeys = Tags.from(e).type("p").values().all()

              loadPubkeys(pubkeys)
            },
          })
        : subscribe({
            relays: getPubkeyHints(pubkey, "read"),
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

<Content gap="gap-2">
  {#each pubkeys.slice(0, limit) as pubkey (pubkey)}
    <PersonSummary {pubkey} />
  {:else}
    <Spinner />
  {/each}
</Content>
