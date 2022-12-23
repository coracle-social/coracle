<script>
  import {when, take, propEq} from 'ramda'
  import {onMount, onDestroy} from 'svelte'
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor, getLastSync} from 'src/util/misc'
  import relay, {user, network} from 'src/relay'

  let sub

  const cursor = new Cursor(
    getLastSync('views/notes/Network'),
    timedelta(1, 'hours')
  )

  onMount(async () => {
    sub = await relay.pool.listenForEvents(
      'views/notes/Network',
      [{kinds: [1, 5, 7], authors: $network, since: cursor.since}],
      when(propEq('kind', 1), relay.loadNoteContext)
    )
  })

  onDestroy(() => {
    if (sub) {
      sub.unsub()
    }
  })

  const loadNotes = async limit => {
    const filter = {kinds: [1], authors: $network.concat($user.pubkey)}
    const notes = take(limit + 1, await relay.filterEvents(filter))

    if (notes.length <= limit) {
      const [since, until] = cursor.step()

      relay.pool.loadEvents(
        [{kinds: [1, 5, 7], authors: $network, since, until}],
        when(propEq('kind', 1), relay.loadNoteContext)
      )
    }

    return relay.annotateChunk(notes.slice(0, limit))
  }
</script>

<Notes shouldMuffle loadNotes={loadNotes} />
