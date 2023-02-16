<script>
  import Notes from "src/partials/Notes.svelte"
  import {isLike} from 'src/util/nostr'

  const filter = {kinds: [1, 7]}

  const shouldDisplay = note => {
    return (
      note.reactions.filter(isLike).length > 2
      || note.replies.length > 2
    )
  }
</script>

<Notes {filter} {shouldDisplay} />
