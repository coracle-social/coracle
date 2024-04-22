<script lang="ts">
  import {onMount} from "svelte"
  import {defer} from "hurdak"
  import {getIdOrAddress} from "@welshman/util"
  import {isMobile} from "src/util/html"
  import {fly} from "src/util/transition"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/app/shared/Note.svelte"
  import type {Event} from "src/engine"
  import {dereferenceNote} from "src/engine"

  export let relays = []
  export let context = []
  export let depth = isMobile ? 2 : 5

  let promise: Promise<Event> = defer()

  onMount(() => {
    promise = dereferenceNote($$props)
  })
</script>

{#await promise}
  <Spinner />
{:then note}
  {#if note}
    <div in:fly={{y: 20}}>
      <Note showGroup showLoading anchor={getIdOrAddress(note)} {note} {depth} {relays} {context} />
    </div>
  {:else}
    <p class="text-center">Failed to load note.</p>
  {/if}
{/await}
