<script lang="ts">
  import {onMount} from "svelte"
  import {fly} from "svelte/transition"
  import {uniq} from "@welshman/lib"
  import {deriveEvents} from "@welshman/store"
  import {Router, repository, addMaximalFallbacks} from "@welshman/app"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonList from "src/app/shared/PersonList.svelte"
  import {pullConservatively} from "src/engine"

  export let pubkey

  const relays = Router.get().ForPubkey(pubkey).policy(addMaximalFallbacks).getUrls()
  const filters = [{kinds: [3], "#p": [pubkey]}]
  const events = deriveEvents(repository, {filters})

  $: pubkeys = uniq($events.map(event => event.pubkey))

  onMount(() => {
    pullConservatively({relays, filters})
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
