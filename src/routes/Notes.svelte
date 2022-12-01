<script>
  import {onMount, onDestroy} from 'svelte'
  import {writable} from 'svelte/store'
  import {fly} from 'svelte/transition'
  import {navigate} from "svelte-routing"
  import {uniqBy, prop} from 'ramda'
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/partials/Note.svelte"
  import {relays, Cursor} from "src/state/nostr"
  import {scroller, annotateNotes, notesListener, modal} from "src/state/app"

  const notes = writable([])
  let cursor
  let listener
  let scroll

  const createNote = () => {
    navigate("/notes/new")
  }

  onMount(async () => {
    cursor = new Cursor({kinds: [1]})
    listener = await notesListener(notes, {kinds: [1, 5, 7]})
    scroll = scroller(cursor, async chunk => {
      const annotated = await annotateNotes(chunk, {showParents: true})

      notes.update($notes => uniqBy(prop('id'), $notes.concat(annotated)))
    })

    // Populate our initial empty space
    scroll()

    // When a modal opens, suspend our subscriptions
    const modalUnsub = modal.subscribe(async $modal => {
      if ($modal) {
        cursor.stop()
        listener.stop()
      } else {
        cursor.start()
        listener.start()
      }
    })

    return () => {
      modalUnsub()
    }
  })

  onDestroy(() => {
    cursor?.stop()
    listener?.stop()
  })
</script>

<svelte:window on:scroll={scroll} />

<ul class="py-8 flex flex-col gap-2 max-w-xl m-auto">
  {#each (notes ? $notes : []) as n (n.id)}
    <li class="border-l border-solid border-medium">
      <Note interactive note={n} />
      {#each n.replies as r (r.id)}
      <div class="ml-6 border-l border-solid border-medium">
        <Note interactive isReply note={r} />
      </div>
      {/each}
    </li>
  {/each}
</ul>

<!-- This will always be sitting at the bottom in case infinite scrolling can't keep up -->
<Spinner />

{#if $relays.length > 0}
<div class="fixed bottom-0 right-0 p-8">
  <div
    class="rounded-full bg-accent color-white w-16 h-16 flex justify-center
            items-center border border-dark shadow-2xl cursor-pointer"
    on:click={createNote}
  >
    <span class="fa-sold fa-plus fa-2xl" />
  </div>
</div>
{:else}
<div class="flex w-full justify-center items-center py-16">
  <div class="text-center max-w-md">
    You aren't yet connected to any relays. Please click <Anchor href="/settings/relays"
      >here</Anchor
    > to get started.
  </div>
</div>
{/if}

