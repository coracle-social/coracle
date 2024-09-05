<script lang="ts">
  import {isMobile} from "src/util/html"
  import {fly} from "src/util/transition"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/app/shared/Note.svelte"
  import {deriveEvent} from "src/engine"

  export let id = null
  export let address = null
  export let relays = []
  export let depth = isMobile ? 2 : 5

  const event = deriveEvent(id || address)
</script>

{#if $event}
  <Spinner />
{:else}
  <div in:fly={{y: 20}}>
    <Note showGroup showLoading anchor={id || address} note={$event} {depth} {relays} />
  </div>
{/if}
