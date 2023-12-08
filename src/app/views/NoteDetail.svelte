<script lang="ts">
  import {onMount} from "svelte"
  import {defer} from "hurdak"
  import {isMobile} from "src/util/html"
  import {getIdOrAddress} from "src/util/nostr"
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
  <div in:fly={{y: 20}}>
    <Note showGroup showLoading anchor={getIdOrAddress(note)} {note} {depth} {relays} {context} />
  </div>
{/await}
