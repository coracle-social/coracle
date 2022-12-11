<script>
  import {onMount} from 'svelte'
  import {writable} from 'svelte/store'
  import {reverse} from 'ramda'
  import Spinner from 'src/partials/Spinner.svelte'
  import {channels} from "src/state/nostr"
  import {notesListener, threadify, modal} from "src/state/app"
  import {user} from "src/state/user"
  import Note from 'src/partials/Note.svelte'

  export let note

  let notes = writable([])
  let cursor
  let listener

  const getAncestors = n => {
    const parents = []

    while (n.parent) {
      parents.push(n.parent)
      n = n.parent
    }

    return reverse(parents)
  }

  onMount(() => {
    channels.getter
      .all({kinds: [1], ids: [note.id]})
      .then(threadify)
      .then($notes => {
        notes.set($notes)
      })

    listener = notesListener(notes, [
      {kinds: [1, 5, 7], '#e': [note.id]},
      // We can't target reaction deletes by e tag, so get them
      // all so we can support toggling like/flags for our user
      {kinds: [5], authors: $user ? [$user.pubkey] : []}
    ])

    // Populate our initial empty space
    listener.start()

    // Unsubscribe when modal closes so that others can re-subscribe sooner
    const unsubModal = modal.subscribe($modal => {
      cursor?.stop()
      listener?.stop()
    })

    return () => {
      unsubModal()
    }
  })
</script>

{#each $notes as note (note.id)}
<div n:fly={{y: 20}}>
  <div class="relative">
    {#if note.parent}
      <div class="w-px bg-medium absolute h-full ml-5 -mr-5 mt-5" />
    {/if}
    {#each getAncestors(note) as ancestor (ancestor.id)}
    <Note interactive invertColors note={ancestor} />
    {/each}
  </div>
  <Note showEntire invertColors depth={5} note={note} />
</div>
{:else}
<Spinner />
{/each}
