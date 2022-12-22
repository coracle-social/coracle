<script>
  import {onMount, onDestroy} from 'svelte'
  import {findReply} from 'src/util/nostr'
  import Notes from "src/views/Notes.svelte"
  import {now, timedelta, Cursor, getLastSync} from 'src/util/misc'
  import relay, {network} from 'src/relay'

  let sub

  const cursor = new Cursor(
    getLastSync('views/notes/Network'),
    timedelta(1, 'hours')
  )

  const onEvent = async e => {
    if (e.kind === 1) {
      const filter = await relay.buildNoteContextFilter(e)

      await relay.pool.loadEvents(filter)
    }

    if (e.kind === 7) {
      const replyId = findReply(e)

      if (replyId && !await relay.db.events.get(replyId)) {
        await relay.pool.loadEvents({kinds: [1], ids: [replyId]})
      }

    }
  }

  onMount(async () => {
    sub = await relay.pool.listenForEvents(
      'views/notes/Network',
      [{kinds: [1, 5, 7], authors: $network, since: cursor.since}],
      onEvent
    )
  })

  onDestroy(() => {
    if (sub) {
      sub.unsub()
    }
  })

  const loadNotes = async limit => {
    const filter = {kinds: [1], authors: $network}
    const notes = await relay.filterEvents(filter).reverse().sortBy('created_at')

    if (notes.length < limit) {
      const [since, until] = cursor.step()

      relay.pool.loadEvents(
        [{kinds: [1, 5, 7], authors: $network, since, until}],
        onEvent
      )
    }

    return relay.annotateChunk(notes.slice(0, limit))
  }
</script>

<Notes shouldMuffle loadNotes={loadNotes} />
