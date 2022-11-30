<script>
  import {onMount} from 'svelte'
  import {writable} from 'svelte/store'
  import {navigate} from "svelte-routing"
  import Anchor from "src/partials/Anchor.svelte"
  import Note from "src/partials/Note.svelte"
  import {relays} from "src/state/nostr"
  import {notesLoader, notesListener} from "src/state/app"

  const notes = writable([])
  let onScroll

  const createNote = () => {
    navigate("/notes/new")
  }

  onMount(async () => {
    const loader = await notesLoader(notes, {kinds: [1]}, {showParents: true})
    const listener = await notesListener(notes, {kinds: [1]})

    onScroll = loader.onScroll

    return () => {
      loader.unsub()
      listener.unsub()
    }
  })
</script>

<svelte:window on:scroll={onScroll} />

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

