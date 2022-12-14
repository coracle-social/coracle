<script>
  import {onMount} from 'svelte'
  import {writable} from 'svelte/store'
  import {reverse} from 'ramda'
  import Spinner from 'src/partials/Spinner.svelte'
  import {channels} from "src/state/nostr"
  import {notesListener, annotateNotes, modal} from "src/state/app"
  import {user} from "src/state/user"
  import Note from 'src/partials/Note.svelte'

  export let note

  let notes = writable([])
  let cursor
  let listener

  onMount(() => {
    channels.getter
      .all({kinds: [1], ids: [note.id]})
      .then(async $notes => {
        notes.set(await annotateNotes($notes))
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

{#each $notes as n (n.id)}
<div n:fly={{y: 20}}>
  <Note showEntire showParent invertColors anchorId={note.id} note={n} depth={2} />
</div>
{:else}
<Spinner />
{/each}
