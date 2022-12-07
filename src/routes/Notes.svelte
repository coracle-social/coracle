<script>
  import {onMount, onDestroy} from 'svelte'
  import {fly} from 'svelte/transition'
  import {writable} from 'svelte/store'
  import {navigate} from "svelte-routing"
  import {uniqBy, reject, prop} from 'ramda'
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/partials/Note.svelte"
  import {relays, Cursor} from "src/state/nostr"
  import {user} from "src/state/user"
  import {createScroller, getMuffleValue, annotateNotes, notesListener, modal} from "src/state/app"

  export let type

  const notes = writable([])
  let cursor
  let listener
  let scroller
  let modalUnsub
  let authors = $user ? $user.petnames.map(t => t[1]) : []

  const createNote = () => {
    navigate("/notes/new")
  }

  onMount(async () => {
    cursor = new Cursor(type === 'global' ? {kinds: [1]} : {kinds: [1], authors})
    listener = await notesListener(notes, {kinds: [1, 5, 7]})
    scroller = createScroller(cursor, async chunk => {
      // Remove a sampling of content if desired
      chunk = reject(n => Math.random() > getMuffleValue(n.pubkey), chunk)

      const annotated = await annotateNotes(chunk, {showParents: true})

      notes.update($notes => uniqBy(prop('id'), $notes.concat(annotated)))
    })

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
  })
</script>

<svelte:window on:scroll={scroller?.start} />

{#if $relays.length === 0}
<div class="flex w-full justify-center items-center py-16">
  <div class="text-center max-w-md">
    You aren't yet connected to any relays. Please click <Anchor href="/relays"
      >here</Anchor
    > to get started.
  </div>
</div>
{:else}
<ul class="border-b border-solid border-dark flex max-w-xl m-auto pt-2" in:fly={{y: 20}}>
  <li
    class="cursor-pointer hover:border-b border-solid border-medium"
    class:border-b={type === 'global'}>
    <a class="block px-8 py-4 " href="/notes/global">Global</a>
  </li>
  <li
    class="cursor-pointer hover:border-b border-solid border-medium"
    class:border-b={type === 'follows'}>
    <a class="block px-8 py-4 " href="/notes/follows">Follows</a>
  </li>
</ul>

{#if type === 'follows' && authors.length === 0}
<div class="flex w-full justify-center items-center py-16">
  <div class="text-center max-w-md">
    You haven't yet followed anyone. Visit a user's profile to follow them.
  </div>
</div>
{:else}
<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#each (notes ? $notes : []) as n (n.id)}
    <li>
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
{/if}

<div class="fixed bottom-0 right-0 p-8">
  <div
    class="rounded-full bg-accent color-white w-16 h-16 flex justify-center
            items-center border border-dark shadow-2xl cursor-pointer"
    on:click={createNote}
  >
    <span class="fa-sold fa-plus fa-2xl" />
  </div>
</div>
{/if}

