<script lang="ts">
  import {onMount} from "svelte"
  import {uniq, pluck} from "ramda"
  import {batch} from "hurdak"
  import type {TrustedEvent} from "@welshman/util"
  import PersonList from "src/app/shared/PersonList.svelte"
  import {subscribe, loadPubkeys, hints} from "src/engine"

  export let pubkey

  let pubkeys = []

  onMount(() => {
    const sub = subscribe({
      relays: hints.FromPubkeys([pubkey]).getUrls(),
      filters: [{kinds: [3], "#p": [pubkey]}],
      onEvent: batch(500, (events: TrustedEvent[]) => {
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
