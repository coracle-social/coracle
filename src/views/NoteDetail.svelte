<script>
  import {first} from 'hurdak/lib/hurdak'
  import {fly} from 'svelte/transition'
  import {load} from 'src/agent'
  import loaders from 'src/app/loaders'
  import query from 'src/app/query'
  import Note from 'src/partials/Note.svelte'
  import Spinner from 'src/partials/Spinner.svelte'

  export let note
  export let relays

  if (!note.pubkey) {
    load(relays, {ids: [note.id]}).then(async events => {
      const found = first(events)

      if (found) {
        const context = await loaders.loadContext(relays, found)

        note = query.annotate(found, context, {showEntire: true, depth: 3})
      }

      // Log this for debugging purposes
      console.log('NoteDetail', note)
    })
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
