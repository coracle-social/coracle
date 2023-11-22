<script lang="ts">
  import {onMount} from "svelte"
  import {defer} from "hurdak"
  import {isMobile} from "src/util/html"
  import {fly} from "src/util/transition"
  import Content from "src/partials/Content.svelte"
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

<Content>
  {#await promise}
    <Spinner />
  {:then note}
    <div in:fly={{y: 20}}>
      <Note showGroup showLoading anchorId={note.id} {note} {depth} {relays} {context} />
    </div>
  {/await}
</Content>
