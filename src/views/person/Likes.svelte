<script>
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor} from 'src/util/misc'
  import {getTagValues} from 'src/util/nostr'
  import {user, load} from 'src/agent'
  import {getRelays} from 'src/app'
  import loaders from 'src/app/loaders'
  import query from 'src/app/query'

  export let pubkey

  const cursor = new Cursor(timedelta(1, 'days'))

  const loadNotes = async () => {
    const [since, until] = cursor.step()
    const filter = {kinds: [7], authors: [pubkey], since, until}
    const notes = await load(getRelays(), filter)

    await loaders.loadNotesContext(getRelays(), notes, {loadParents: true})
  }

  const queryNotes = () => {
    return query.filterEvents({
      kinds: [7],
      since: cursor.since,
      authors: [pubkey],
      muffle: getTagValues($user?.muffle || []),
    })
  }
</script>

<Notes shouldMuffle {loadNotes} {queryNotes} />

