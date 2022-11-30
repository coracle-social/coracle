<script>
  import {onMount, onDestroy} from 'svelte'
  import {writable} from 'svelte/store'
  import {navigate} from "svelte-routing"
  import Anchor from "src/partials/Anchor.svelte"
  import Note from "src/partials/Note.svelte"
  import {relays} from "src/state/nostr"
  import {notesLoader, notesListener, modal} from "src/state/app"

  const notes = writable([])
  let loader
  let listener

  const createNote = () => {
    navigate("/notes/new")
  }

  onMount(async () => {
    loader = await notesLoader(notes, {kinds: [1]}, {showParents: true})
    listener = await notesListener(notes, {kinds: [1, 5, 7]})

    // Populate our initial empty space
    loader.onScroll()

    // When a modal opens, suspend our subscriptions
    modal.subscribe(async $modal => {
      if ($modal) {
        loader.stop()
        listener.stop()
      } else {
        loader.start()
        listener.start()
      }
    })
  })

  onDestroy(() => {
    loader?.stop()
    listener?.stop()
  })
</script>

<svelte:window on:scroll={loader?.onScroll} />

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

