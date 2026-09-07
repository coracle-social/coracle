<script lang="ts">
  import {onMount} from "svelte"
  import {fly} from "svelte/transition"
  import {noop, uniq} from "@welshman/lib"
  import {FOLLOWS, inbox} from "@welshman/util"
  import {Events} from "@welshman/app"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonList from "src/app/shared/PersonList.svelte"
  import {pullConservatively} from "src/engine"
  import {fromApp, resolveRelays} from "src/engine/core"

  export let pubkey

  const filters = [{kinds: [FOLLOWS], "#p": [pubkey]}]
  const events = fromApp($app => $app.use(Events).all(filters).$)

  $: pubkeys = uniq($events.map(event => event.pubkey))

  onMount(() => {
    // Relay selection resolves asynchronously now, so this pull starts a tick later
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
