<script>
  import {onMount, onDestroy} from 'svelte'
  import {fly} from 'svelte/transition'
  import {uniqBy, sortBy, prop, identity} from 'ramda'
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/partials/Note.svelte"
  import {Cursor, epoch, findReply, channels} from 'src/state/nostr'
  import {createScroller, notesListener, annotateNotes, modal} from "src/state/app"

  export let author
  export let notes

  let cursor
  let listener
  let scroller
  let modalUnsub
  let interval
  let loading = true

  const addLikes = async likes => {
    const noteIds = likes.filter(e => e.content === '+').map(findReply).filter(identity)

    if (noteIds.length === 0) {
      return
    }

    const chunk = await channels.getter.all({kinds: [1], ids: noteIds})
    const annotated = await annotateNotes(chunk, {showParent: false})

    notes.update($notes => sortBy(n => -n.created_at, uniqBy(prop('id'), $notes.concat(annotated))))
  }

  onMount(async () => {
    cursor = new Cursor({kinds: [7], authors: [author]})
    listener = notesListener(notes, {kinds: [1, 5, 7], authors: [author]})
    scroller = createScroller(cursor, addLikes)

    // Track loading based on cursor cutoff date
    interval = setInterval(() => {
      loading = cursor.since > epoch
    }, 1000)

    // When a modal opens, suspend our subscriptions
    modalUnsub = modal.subscribe(async $modal => {
      if ($modal) {
        cursor.stop()
        listener.stop()
        scroller.stop()
      } else {
        cursor.start()
        listener.start()
        scroller.start()
      }
    })
  })

  onDestroy(() => {
    cursor?.stop()
    listener?.stop()
    scroller?.stop()
    modalUnsub?.()
    clearInterval(interval)
  })
</script>

<svelte:window on:scroll={scroller?.start} />

<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#each $notes as n (n.id)}
    <li><Note interactive noReply note={n} depth={1} /></li>
  {:else}
  {#if loading}
  <li><Spinner /></li>
  {:else}
  <li class="p-20 text-center" in:fly={{y: 20}}>No notes found.</li>
  {/if}
  {/each}
</ul>
