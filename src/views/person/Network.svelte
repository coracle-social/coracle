<script>
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor} from 'src/util/misc'
  import {getTagValues} from 'src/util/nostr'
  import relay, {user} from 'src/relay'

  export let person

  const cursor = new Cursor(timedelta(1, 'hours'))

  const loadNotes = async () => {
    const [since, until] = cursor.step()
    const authors = getTagValues(person.petnames)
    const filter = {kinds: [1], authors, since, until}
    const muffle = getTagValues($user?.muffle || [])

    await relay.pool.loadEvents(filter)

    return relay.filterEvents({...filter, muffle})
  }
</script>

<Notes shouldMuffle {loadNotes} />

