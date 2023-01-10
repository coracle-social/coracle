<script>
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor} from 'src/util/misc'
  import {load, getRelays} from 'src/agent'
  import loaders from 'src/app/loaders'
  import query from 'src/app/query'

  export let pubkey

  const cursor = new Cursor(timedelta(1, 'days'))

  const loadNotes = async () => {
    const [since, until] = cursor.step()
    const filter = {kinds: [1], authors: [pubkey], since, until}
    const notes = await load(getRelays(pubkey), filter)

    await loaders.loadNotesContext(getRelays(pubkey), notes, {loadParents: true})
  }

  const queryNotes = () => {
    return query.filterEvents({
      kinds: [1],
      since: cursor.since,
      authors: [pubkey],
    })
  }
</script>

<Notes shouldMuffle {loadNotes} {queryNotes} />

