<script>
  import {onMount, onDestroy} from 'svelte'
  import {findReply} from 'src/util/nostr'
  import Notes from "src/views/Notes.svelte"
  import {now, timedelta, getLastSync} from 'src/util/misc'
  import relay, {network} from 'src/relay'

  let sub
  let since = getLastSync('views/Global')

  onMount(async () => {
    sub = await subscribe(now())
  })

  onDestroy(() => {
    if (sub) {
      sub.unsub()
    }
  })

  const subscribe = until =>
    relay.pool.listenForEvents(
      'views/Network',
      [{kinds: [1, 5, 7], authors: $network, since, until}],
      async e => {
        if (e.kind === 1) {
          const filter = await relay.buildNoteContextFilter(e, {since})

          await relay.pool.loadEvents(filter)
        }

        if (e.kind === 7) {
          const replyId = findReply(e)

          if (replyId && !await relay.db.events.get(replyId)) {
            await relay.pool.loadEvents({kinds: [1], ids: [replyId]})
          }

        }
      }
    )

  const loadNotes = async limit => {
    const filter = {kinds: [1], authors: $network}
    const notes = await relay.filterEvents(filter).reverse().sortBy('created_at')

    if (notes.length < limit) {
      const until = notes.reduce((t, n) => Math.min(n.created_at), since)

      since = until - timedelta(1, 'hours')

      sub = await subscribe(since)
    }

    return relay.annotateChunk(notes.slice(0, limit))
  }
</script>

<Notes shouldMuffle loadNotes={loadNotes} />
