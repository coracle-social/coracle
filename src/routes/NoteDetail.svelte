<script>
  import {fly} from 'svelte/transition'
  import {loadNote} from 'src/app'
  import Note from 'src/partials/Note.svelte'
  import Spinner from 'src/partials/Spinner.svelte'

  export let id
  export let relays

  let note = {id}

  console.log(id, relays)

  loadNote(relays, id).then(found => {
    note = found
  })
</script>

{#if !note}
<div class="p-4 text-center text-white" in:fly={{y: 20}}>
  Sorry, we weren't able to find this note.
</div>
{:else if note.pubkey}
<div in:fly={{y: 20}}>
  <Note invertColors anchorId={note.id} note={note} depth={2} />
</div>
{:else}
<Spinner />
{/if}
