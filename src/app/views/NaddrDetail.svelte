<script lang="ts">
  import Content from "src/partials/Content.svelte"
  import Note from "src/app/shared/Note.svelte"
  import {load, selectHints} from "src/engine"

  export let identifier
  export let kind
  export let pubkey
  export let relays = []

  let note

  load({
    relays: selectHints(relays),
    filters: [{kinds: [kind], authors: [pubkey], "#d": [identifier]}],
    onEvent: event => {
      note = event
    },
  })
</script>

<Content>
  {#if note}
    <Note topLevel depth={3} anchorId={note.id} {note} />
  {/if}
</Content>
