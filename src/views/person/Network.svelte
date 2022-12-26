<script>
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor} from 'src/util/misc'
  import {getTagValues} from 'src/util/nostr'
  import relay, {user} from 'src/relay'

  export let person

  const cursor = new Cursor(timedelta(1, 'hours'))

  const loadNotes = async () => {
    const [since, until] = cursor.step()

    return relay.pool.loadEvents({
      since,
      until,
      kinds: [1],
      authors: getTagValues(person.petnames),
    })
  }

  const queryNotes = () => {
    return relay.filterEvents({
      kinds: [1],
      since: cursor.since,
      authors: getTagValues(person.petnames),
      muffle: getTagValues($user?.muffle || []),
    })
  }
</script>

<Notes shouldMuffle {loadNotes} {queryNotes} />

