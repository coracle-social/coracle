<script>
  import {onMount, onDestroy} from 'svelte'
  import relay from 'src/relay'
  import {getLastSync} from 'src/util/misc'
  import Note from 'src/views/Note.svelte'
  import Spinner from 'src/partials/Spinner.svelte'

  export let note

  let observable, sub

  onMount(async () => {
    note = await relay.getOrLoadNote(note.id)

    if (note) {
      sub = await relay.pool.listenForEvents(
        'routes/NoteDetail',
        await relay.buildNoteContextFilter(note)
      )
    }
  })

  onDestroy(() => {
    if (sub) {
      sub.unsub()
    }
  })

  onMount(() => {
    observable = relay.lq(async () => {
      const details = await relay.findNote(note.id, {showEntire: true})

      // Log this for debugging purposes
      console.log('NoteDetail', details)

      return details
    })

    return () => {
      if (sub) {
        sub.unsub()
      }
    }
  })
</script>

{#if !note}
<div class="text-white">
  Sorry, we weren't able to find this note.
</div>
{:else if $observable}
<div n:fly={{y: 20}}>
  <Note showParent invertColors anchorId={note.id} note={$observable} depth={2} />
</div>
{:else}
<Spinner />
{/if}
