<script>
  import {when, propEq} from 'ramda'
  import {onMount, onDestroy} from 'svelte'
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor} from 'src/util/misc'
  import {getTagValues} from 'src/util/nostr'
  import relay, {user, network} from 'src/relay'

  let notes, sub, networkUnsub

  onMount(() => {
    // We need to re-create the sub when network changes, since this is where
    // we land when we first log in, but before network is loaded, leading to
    // a forever spinner.
    networkUnsub = network.subscribe(async $network => {
      sub = await relay.pool.listenForEvents(
        'views/notes/Network',
        [{kinds: [1, 5, 7], authors: $network, since: cursor.since}],
        when(propEq('kind', 1), async e => {
          await relay.loadNoteContext(e)

          notes.addNewNotes([e])
        })
      )
    })
  })

  onDestroy(() => {
    networkUnsub()

    if (sub) {
      sub.unsub()
    }
  })

  const cursor = new Cursor(timedelta(10, 'minutes'))

  const loadNotes = async () => {
    const [since, until] = cursor.step()

    await relay.pool.loadEvents(
      [{kinds: [1, 5, 7], authors: $network, since, until}],
      when(propEq('kind', 1), relay.loadNoteContext)
    )

    return relay.filterEvents({
      since,
      until,
      kinds: [1],
      authors: $network.concat($user.pubkey),
      muffle: getTagValues($user?.muffle || []),
    })
  }
</script>

<Notes bind:this={notes} shouldMuffle {loadNotes} />

