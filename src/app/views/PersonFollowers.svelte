<script lang="ts">
  import {onMount} from "svelte"
  import {uniq, pluck} from "ramda"
  import {batch} from "hurdak"
  import type {TrustedEvent} from "@welshman/util"
  import PersonList from "src/app/shared/PersonList.svelte"
  import {subscribe} from "src/engine"

  export let pubkey

  let pubkeys = []

  onMount(() => {
    const sub = subscribe({
      filters: [{kinds: [3], "#p": [pubkey]}],
      onEvent: batch(500, (events: TrustedEvent[]) => {
        pubkeys = uniq(pubkeys.concat(pluck("pubkey", events)))
      }),
    })

    return () => {
      sub.close()
    }
  })
</script>

<PersonList {pubkeys} />
