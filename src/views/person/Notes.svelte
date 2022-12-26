<script>
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor} from 'src/util/misc'
  import relay from 'src/relay'

  export let pubkey

  const cursor = new Cursor(timedelta(1, 'days'))

  const loadNotes = async () => {
    const [since, until] = cursor.step()
    const filter = {kinds: [1], authors: [pubkey], since, until}

    await relay.pool.loadEvents(filter, relay.loadNoteContext)

    return relay.filterEvents(filter)
  }
</script>

<Notes shouldMuffle {loadNotes} />

