<script>
  import {fly} from 'svelte/transition'
  import {loadNote} from 'src/app'
  import {getRelays} from 'src/agent'
  import Note from 'src/partials/Note.svelte'
  import Spinner from 'src/partials/Spinner.svelte'

  export let note
  export let relays = getRelays()

  if (!note.pubkey) {
    loadNote(relays, note.id).then(found => {
      note = found
    })
  } else {
    console.log('NoteDetail', note)
  }
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
