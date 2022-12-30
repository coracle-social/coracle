<script>
  import {when, propEq} from 'ramda'
  import {onMount, onDestroy} from 'svelte'
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor} from 'src/util/misc'
  import {getTagValues} from 'src/util/nostr'
  import relay, {user} from 'src/relay'

  let sub

  onMount(async () => {
    sub = await relay.pool.listenForEvents(
      'views/notes/Global',
      [{kinds: [1, 5, 7], since: cursor.since}],
      when(propEq('kind', 1), relay.loadNotesContext)
    )
  })

  onDestroy(() => {
    if (sub) {
      sub.unsub()
    }
  })

  const cursor = new Cursor(timedelta(1, 'minutes'))

  const loadNotes = async () => {
    const [since, until] = cursor.step()
    const filter = {kinds: [1], since, until}
    const notes = await relay.pool.loadEvents(filter)
    await relay.loadNotesContext(notes, {loadParents: true})
  }

  const queryNotes = () => {
    return relay.filterEvents({
      kinds: [1],
      since: cursor.since,
      muffle: getTagValues($user?.muffle || []),
    })
  }
</script>

<Notes shouldMuffle {loadNotes} {queryNotes} />
