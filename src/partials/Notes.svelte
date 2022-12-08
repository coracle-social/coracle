<script>
  import {onMount, onDestroy} from 'svelte'
  import {fly} from 'svelte/transition'
  import {uniqBy, reject, prop} from 'ramda'
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/partials/Note.svelte"
  import {Cursor, epoch} from 'src/state/nostr'
  import {createScroller, getMuffleValue, annotateNotes, notesListener, modal} from "src/state/app"

  export let filter
  export let notes
  export let shouldMuffle = false

  let cursor
  let listener
  let scroller
  let modalUnsub
  let interval
  let loading = true

  onMount(async () => {
    cursor = new Cursor(filter)
    listener = await notesListener(notes, [filter, {kinds: [5, 7]}], {shouldMuffle})
    scroller = createScroller(cursor, async chunk => {
      // Remove a sampling of content if desired
      if (shouldMuffle) {
        chunk = reject(n => Math.random() > getMuffleValue(n.pubkey), chunk)
      }

      const annotated = await annotateNotes(chunk, {showParents: true})

      notes.update($notes => uniqBy(prop('id'), $notes.concat(annotated)))
    })

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
    <li>
      <Note interactive note={n} />
      {#each n.replies as r (r.id)}
      <div class="ml-6 border-l border-solid border-medium">
        <Note interactive isReply note={r} />
      </div>
      {/each}
    </li>
  {:else}
  {#if loading}
  <li><Spinner /></li>
  {:else}
  <li class="p-20 text-center" in:fly={{y: 20}}>No notes found.</li>
  {/if}
  {/each}
</ul>
