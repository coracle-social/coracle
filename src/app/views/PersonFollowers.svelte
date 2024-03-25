<script lang="ts">
  import {onMount} from "svelte"
  import {uniq, pluck} from "ramda"
  import {batch} from "hurdak"
  import PersonList from "src/app/shared/PersonList.svelte"
  import type {Event} from "src/engine"
  import {subscribe, loadPubkeys, hints} from "src/engine"

  export let pubkey

  let pubkeys = []

  onMount(() => {
    const sub = subscribe({
      relays: hints.FromPubkeys([pubkey]).getUrls(),
      filters: [{kinds: [3], "#p": [pubkey]}],
      onEvent: batch(500, (events: Event[]) => {
        const newPubkeys = pluck("pubkey", events)

        loadPubkeys(newPubkeys)

        pubkeys = uniq(pubkeys.concat(newPubkeys))
      }),
    })

    return () => {
      sub.close()
    }
  })
</script>

<PersonList {pubkeys} />
