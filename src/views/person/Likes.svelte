<script>
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor} from 'src/util/misc'
  import {getTagValues} from 'src/util/nostr'
  import relay, {user} from 'src/relay'

  export let pubkey

  const cursor = new Cursor(timedelta(1, 'days'))

  const loadNotes = async () => {
    const [since, until] = cursor.step()
    const filter = {kinds: [7], authors: [pubkey], since, until}

    await relay.loadNotesContext(
      await relay.pool.loadEvents(filter),
      {loadParents: true}
    )
  }

  const queryNotes = () => {
    return relay.filterEvents({
      kinds: [7],
      since: cursor.since,
      authors: [pubkey],
      muffle: getTagValues($user?.muffle || []),
    })
  }
</script>

<Notes shouldMuffle {loadNotes} {queryNotes} />

