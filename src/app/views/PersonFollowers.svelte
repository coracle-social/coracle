<script lang="ts">
  import {onMount} from "svelte"
  import {fly} from "svelte/transition"
  import {noop, uniq} from "@welshman/lib"
  import {FOLLOWS, inbox} from "@welshman/util"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonList from "src/app/shared/PersonList.svelte"
  import {pullConservatively} from "src/engine"
  import {deriveEvents, resolveRelays} from "src/engine/core"

  export let pubkey

  const filters = [{kinds: [FOLLOWS], "#p": [pubkey]}]
  const events = deriveEvents(filters)

  $: pubkeys = uniq($events.map(event => event.pubkey))

  onMount(() => {
    resolveRelays([inbox(pubkey)])
      .then(relays => pullConservatively({relays, filters}))
      .catch(noop)
  })
</script>

{#if $events.length === 0}
  <div class="flex h-64 items-center justify-center">
    <Spinner />
  </div>
{:else}
  <div transition:fly|local={{y: 20}}>
    <PersonList {pubkeys} />
  </div>
{/if}
