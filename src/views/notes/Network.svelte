<script>
  import {when, take, propEq} from 'ramda'
  import {onMount, onDestroy} from 'svelte'
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor, getLastSync} from 'src/util/misc'
  import {getTagValues} from 'src/util/nostr'
  import relay, {user, network} from 'src/relay'

  let sub
  let networkUnsub

  const cursor = new Cursor(
    getLastSync('views/notes/Network'),
    timedelta(1, 'hours')
  )

  onMount(() => {
    // We need to re-create the sub when network changes, since this is where
    // we land when we first log in, but before network is loaded, leading to
    // a forever spinner.
    networkUnsub = network.subscribe(async $network => {
      sub = await relay.pool.listenForEvents(
        'views/notes/Network',
        [{kinds: [1, 5, 7], authors: $network, since: cursor.since}],
        when(propEq('kind', 1), relay.loadNoteContext)
      )
    })
  })

  onDestroy(() => {
    networkUnsub()

    if (sub) {
      sub.unsub()
    }
  })

  const loadNotes = async limit => {
    const notes = take(limit + 1, await relay.filterEvents({
      kinds: [1],
      authors: $network.concat($user.pubkey),
      muffle: getTagValues($user?.muffle || []),
    }))

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

<!-- hack to reload notes when our network initiall loads, see onMount -->
{#key $network.map(n => n[0]).join('')}
<Notes shouldMuffle loadNotes={loadNotes} />
{/key}
