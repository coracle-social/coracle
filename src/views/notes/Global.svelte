<script>
  import {when, take, propEq} from 'ramda'
  import {onMount, onDestroy} from 'svelte'
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor, getLastSync} from 'src/util/misc'
  import {getTagValues} from 'src/util/nostr'
  import relay, {user} from 'src/relay'

  let sub

  const cursor = new Cursor(
    getLastSync('views/notes/Global'),
    timedelta(1, 'minutes')
  )

  onMount(async () => {
    sub = await relay.pool.listenForEvents(
      'views/notes/Global',
      [{kinds: [1, 5, 7], since: cursor.since}],
      when(propEq('kind', 1), relay.loadNoteContext)
    )
  })

  onDestroy(() => {
    if (sub) {
      sub.unsub()
    }
  })

  const loadNotes = async limit => {
    const notes = take(limit + 1, await relay.filterEvents({
      kinds: [1],
      muffle: getTagValues($user?.muffle || []),
    }))

    if (notes.length <= limit) {
      const [since, until] = cursor.step()

      relay.pool.loadEvents(
        [{kinds: [1, 5, 7], since, until}],
        when(propEq('kind', 1), relay.loadNoteContext)
      )
    }

    return relay.annotateChunk(notes.slice(0, limit))
  }
</script>

<Notes shouldMuffle loadNotes={loadNotes} />
