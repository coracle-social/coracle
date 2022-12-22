<script>
  import {onMount, onDestroy} from 'svelte'
  import {findReply} from 'src/util/nostr'
  import Notes from "src/views/Notes.svelte"
  import {now, timedelta, Cursor, getLastSync} from 'src/util/misc'
  import relay from 'src/relay'

  let sub

  const cursor = new Cursor(
    getLastSync('views/notes/Global'),
    timedelta(1, 'minutes')
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
      'views/notes/Global',
      [{kinds: [1, 5, 7], since: cursor.since}],
      onEvent
    )
  })

  onDestroy(() => {
    if (sub) {
      sub.unsub()
    }
  })

  const loadNotes = async limit => {
    const notes = await relay.filterEvents({kinds: [1]}).reverse().sortBy('created_at')

    if (notes.length < limit) {
      const [since, until] = cursor.step()

      relay.pool.loadEvents([{kinds: [1, 5, 7], since, until}], onEvent)
    }

    return relay.annotateChunk(notes.slice(0, limit))
  }
</script>

<Notes shouldMuffle loadNotes={loadNotes} />
