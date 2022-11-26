<script>
  import {onMount} from 'svelte'
  import {findNotes} from "src/state/app"
  import Note from 'src/partials/Note.svelte'

  export let note

  onMount(() => {
    return findNotes(
      [{ids: [note.id]}, {'#e': [note.id]}],
      $notes => {
        note = $notes[0] || note
      }
    )
  })
</script>

<Note note={note} />
