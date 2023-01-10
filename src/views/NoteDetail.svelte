<script>
  import {liveQuery} from 'dexie'
  import {when, propEq} from 'ramda'
  import {fly} from 'svelte/transition'
  import {onMount, onDestroy} from 'svelte'
  import {now} from 'src/util/misc'
  import {listen, getRelays} from 'src/agent'
  import loaders from 'src/app/loaders'
  import query from 'src/app/query'
  import Note from 'src/partials/Note.svelte'
  import Spinner from 'src/partials/Spinner.svelte'

  export let note

  let observable, sub

  onMount(async () => {
    note = await loaders.getOrLoadNote(getRelays(), note.id)

    // Log this for debugging purposes
    console.log('NoteDetail', note)

    if (note) {
      sub = await listen(
        getRelays(),
        [{kinds: [1, 5, 7], '#e': [note.id], since: now()}],
        when(propEq('kind', 1), e => {
          loaders.loadNotesContext(getRelays(), e)
        })
      )
    }
  })

  onDestroy(() => {
    if (sub) {
      sub.unsub()
    }
  })

  onMount(() => {
    observable = liveQuery(() => query.findNote(note.id, {showEntire: true, depth: 5}))

    return () => {
      if (sub) {
        sub.unsub()
      }
    }
  })
</script>

{#if !note}
<div class="p-4 text-center text-white" in:fly={{y: 20}}>
  Sorry, we weren't able to find this note.
</div>
{:else if $observable}
<div in:fly={{y: 20}}>
  <Note invertColors anchorId={note.id} note={$observable} depth={2} />
</div>
{:else}
<Spinner />
{/if}
