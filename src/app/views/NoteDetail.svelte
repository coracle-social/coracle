<script lang="ts">
  import {isMobile} from "src/util/html"
  import {fly} from "src/util/transition"
  import {getIdOrAddress} from "@welshman/util"
  import Spinner from "src/partials/Spinner.svelte"
  import Thread from "src/app/shared/FeedItem.svelte"
  import {deriveEvent} from "src/engine"

  export let id = null
  export let address = null
  export let relays = []
  export let depth = isMobile ? 2 : 5

  const event = deriveEvent(id || address, {relays})
</script>

{#if $event}
  <div in:fly={{y: 20}}>
    <Thread showLoading anchor={getIdOrAddress($event)} note={$event} {depth} {relays} />
  </div>
{:else}
  <Spinner />
{/if}
