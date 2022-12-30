<script>
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor} from 'src/util/misc'
  import relay from 'src/relay'

  export let pubkey

  const cursor = new Cursor(timedelta(3, 'days'))

  const loadNotes = async () => {
    const [since, until] = cursor.step()
    const filter = {kinds: [1], authors: [pubkey], since, until}

    await relay.loadNotesContext(
      await relay.pool.loadEvents(filter),
      {loadParents: true}
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

