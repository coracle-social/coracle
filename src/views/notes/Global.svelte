<script>
  import {when, propEq} from 'ramda'
  import {onMount, onDestroy} from 'svelte'
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor} from 'src/util/misc'
  import {getTagValues} from 'src/util/nostr'
  import relay, {user} from 'src/relay'

  let notes, sub

  onMount(async () => {
    sub = await relay.pool.listenForEvents(
      'views/notes/Global',
      [{kinds: [1, 5, 7], since: cursor.since}],
      when(propEq('kind', 1), async e => {
        await relay.loadNoteContext(e)

        notes.addNewNotes([e])
      })
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

    await relay.pool.loadEvents(
      [{kinds: [1, 5, 7], since, until}],
      when(propEq('kind', 1), relay.loadNoteContext)
    )

    return relay.filterEvents({
      since,
      until,
      kinds: [1],
      muffle: getTagValues($user?.muffle || []),
    })
  }
</script>

<Notes bind:this={notes} shouldMuffle {loadNotes} />
