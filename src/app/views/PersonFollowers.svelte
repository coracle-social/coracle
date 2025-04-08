<script lang="ts">
  import {onMount} from "svelte"
  import {fly} from "svelte/transition"
  import {uniq} from "@welshman/lib"
  import {Router, addMaximalFallbacks} from "@welshman/app"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonList from "src/app/shared/PersonList.svelte"
  import {myLoad} from "src/engine"

  export let pubkey

  let events = []

  $: pubkeys = uniq(events.map(event => event.pubkey))

  onMount(async () => {
    events = await myLoad({
      relays: Router.get().ForPubkey(pubkey).policy(addMaximalFallbacks).getUrls(),
      filters: [{kinds: [3], "#p": [pubkey]}],
    })
  })
</script>

{#if pubkeys.length > 0}
  <div class="flex h-64 items-center justify-center">
    <Spinner />
  </div>
{:else}
  <div transition:fly|local={{y: 20}}>
    <PersonList {pubkeys} />
  </div>
{/if}
