<script>
  import {nip19} from 'nostr-tools'
  import {fly} from 'svelte/transition'
  import {loadNote} from 'src/app'
  import Note from 'src/partials/Note.svelte'
  import Content from 'src/partials/Content.svelte'
  import Spinner from 'src/partials/Spinner.svelte'

  export let note
  export let relays

  let loading = true

  const logNote = () => {
    if (note) {
      console.log('NoteDetail', nip19.noteEncode(note.id), note)
    }
  }

  loadNote(relays, note.id).then(found => {
    note = found
    loading = false

    logNote()
  })
</script>

{#if !note}
<div in:fly={{y: 20}}>
  <Content size="lg" class="text-center">
    Sorry, we weren't able to find this note.
  </Content>
</div>
{:else if note.pubkey}
<div in:fly={{y: 20}}>
  <Note invertColors anchorId={note.id} note={note} depth={2} />
</div>
{/if}

{#if loading}
<Spinner />
{/if}
