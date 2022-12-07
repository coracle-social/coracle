<script>
  import {onMount} from 'svelte'
  import {writable} from 'svelte/store'
  import Spinner from 'src/partials/Spinner.svelte'
  import {channels} from "src/state/nostr"
  import {notesListener, annotateNotes, modal} from "src/state/app"
  import {user} from "src/state/user"
  import Note from 'src/partials/Note.svelte'

  export let note

  const notes = writable([])
  let cursor
  let listener

  onMount(() => {
    channels.getter
      .all({kinds: [1, 5, 7], ids: [note.id]})
      .then(annotateNotes)
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
  <Note showEntire note={note} />
  {#each note.replies as r (r.id)}
    <div class="ml-4 border-l border-solid border-medium">
      <Note interactive invertColors isReply note={r} />
    {#each r.replies as r2 (r2.id)}
      <div class="ml-4 border-l border-solid border-medium">
        <Note interactive invertColors isReply note={r2} />
      {#each r2.replies as r3 (r3.id)}
        <div class="ml-4 border-l border-solid border-medium">
          <Note interactive invertColors isReply note={r3} />
        </div>
      {/each}
      </div>
    {/each}
    </div>
  {/each}
</div>
{:else}
<Spinner />
{/each}
