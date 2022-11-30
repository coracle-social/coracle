<script>
  import {onMount, onDestroy} from 'svelte'
  import {writable} from 'svelte/store'
  import {uniqBy, prop} from 'ramda'
  import {fly} from 'svelte/transition'
  import Note from "src/partials/Note.svelte"
  import {Cursor} from 'src/state/nostr'
  import {user as currentUser} from 'src/state/user'
  import {accounts, scroller, notesListener, modal, annotateNotes} from "src/state/app"

  export let pubkey

  const notes = writable([])
  let user
  let cursor
  let listener
  let scroll

  $: user = $accounts[pubkey]

  onMount(async () => {
    cursor = new Cursor({kinds: [1], authors: [pubkey]})
    listener = await notesListener(notes, {kinds: [1, 5, 7], authors: [pubkey]})
    scroll = scroller(cursor, async chunk => {
      const annotated = await annotateNotes(chunk, {showParents: true})

      notes.update($notes => uniqBy(prop('id'), $notes.concat(annotated)))
    })

    // Populate our initial empty space
    scroll()

    // When a modal opens, suspend our subscriptions
    modal.subscribe(async $modal => {
      if ($modal) {
        cursor.stop()
        listener.stop()
      } else {
        cursor.start()
        listener.start()
      }
    })
  })

  onDestroy(() => {
    cursor?.stop()
    listener?.stop()
  })
</script>

<svelte:window on:scroll={scroll} />

{#if user}
<div class="max-w-2xl m-auto flex flex-col gap-4 py-8 px-4">
  <div class="flex flex-col gap-4" in:fly={{y: 20}}>
    <div class="flex gap-4">
      <div
        class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
        style="background-image: url({user.picture})" />
      <div class="flex-grow">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl">{user.name}</h1>
          {#if $currentUser?.pubkey === pubkey}
            <a href="/settings/profile" class="cursor-pointer text-sm">
              <i class="fa-solid fa-edit" /> Edit
            </a>
          {/if}
        </div>
        <p>{user.about || ''}</p>
      </div>
    </div>
  </div>
  <div class="h-px bg-medium" in:fly={{y: 20, delay: 200}} />
  <ul class="flex flex-col -mt-4" in:fly={{y: 20, delay: 400}}>
    {#each (notes ? $notes : []) as n (n.id)}
    <li class="border-l border-solid border-medium pb-2">
      <Note interactive note={n} />
      {#each n.replies as r (r.id)}
        <div class="ml-6 border-l border-solid border-medium">
          <Note interactive isReply note={r} />
        </div>
      {/each}
    </li>
    {/each}
  </ul>
</div>
{/if}
