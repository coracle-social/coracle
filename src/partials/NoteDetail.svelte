<script>
  import {onMount} from 'svelte'
  import {ensureAccount} from 'src/state/app'
  import Note from 'src/partials/Note.svelte'

  export let note

  onMount(() => {
    ensureAccount(note.account)
  })
</script>

<Note note={note} />
