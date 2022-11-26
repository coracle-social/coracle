<script>
  import {onMount} from 'svelte'
  import {findNotes} from "src/state/app"
  import {channels} from "src/state/nostr"
  import {user} from "src/state/user"
  import Note from 'src/partials/Note.svelte'

  export let note

  onMount(() => {
    return findNotes(
      channels.modal,
      [{ids: [note.id]},
       {'#e': [note.id]},
       // We can't target deletes by e tag, so get them all so we can
       // support toggling like/flags
       {kinds: [5], authors: [$user.pubkey]}],
      $notes => {
        note = $notes[0] || note
      }
    )
  })
</script>

<Note note={note} />
