<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import {pluck, uniq} from "@welshman/lib"
  import {batch} from "hurdak"
  import PersonList from "src/app/shared/PersonList.svelte"
  import {subscribe} from "src/engine"
  import Spinner from "src/partials/Spinner.svelte"
  import {onMount} from "svelte"
  import {fly} from "svelte/transition"

  export let pubkey

  let pubkeys = []
  let loaded = false

  onMount(() => {
    const sub = subscribe({
      onComplete: () => {
        loaded = true
      },
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

{#if !pubkeys.length && !loaded}
  <div class="flex h-64 items-center justify-center">
    <Spinner />
  </div>
{:else}
  <div transition:fly|local={{y: 20}}>
    <PersonList {pubkeys} />
  </div>
{/if}
