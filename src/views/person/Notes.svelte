<script>
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor} from 'src/util/misc'
  import relay from 'src/relay'

  export let pubkey

  const cursor = new Cursor(timedelta(1, 'days'))

  const loadNotes = () => {
    const [since, until] = cursor.step()

    return relay.pool.loadEvents(
      [{kinds: [1], authors: [pubkey], since, until}],
      relay.loadNoteContext
    )
  }

  const queryNotes = () => {
    return relay.filterEvents({
      kinds: [1],
      since: cursor.since,
      authors: [pubkey],
    })
  }
</script>

<Notes shouldMuffle {loadNotes} {queryNotes} />

