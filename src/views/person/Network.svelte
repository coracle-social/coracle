<script>
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor} from 'src/util/misc'
  import {getTagValues} from 'src/util/nostr'
  import {load, user} from 'src/agent'
  import {getRelays} from 'src/app'
  import loaders from 'src/app/loaders'
  import query from 'src/app/query'

  export let person

  const cursor = new Cursor(timedelta(1, 'hours'))

  const loadNotes = async () => {
    const [since, until] = cursor.step()
    console.log(person)
    const authors = getTagValues(person.petnames)
    const filter = {since, until, kinds: [1], authors}
    const events = await load(getRelays(), filter)

    await loaders.loadNotesContext(getRelays(), events, {loadParents: true})
  }

  const queryNotes = () => {
    return query.filterEvents({
      kinds: [1],
      since: cursor.since,
      authors: getTagValues(person.petnames),
      muffle: getTagValues($user?.muffle || []),
    })
  }
</script>

<Notes shouldMuffle {loadNotes} {queryNotes} />

