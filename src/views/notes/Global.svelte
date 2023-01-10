<script>
  import {when, propEq} from 'ramda'
  import {onMount} from 'svelte'
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor} from 'src/util/misc'
  import {getTagValues} from 'src/util/nostr'
  import {listen, user, load, getRelays} from 'src/agent'
  import loaders from 'src/app/loaders'
  import query from 'src/app/query'

  onMount(() => {
    const sub = listen(
      getRelays(),
      [{kinds: [1, 5, 7], since: cursor.since}],
      when(propEq('kind', 1), e => {
        loaders.loadNotesContext(getRelays(), e)
      })
    )

    return () => {
      sub.then(s => s.unsub())
    }
  })

  const cursor = new Cursor(timedelta(1, 'minutes'))

  const loadNotes = async () => {
    const [since, until] = cursor.step()
    const filter = {kinds: [1], since, until}
    const notes = await load(getRelays(), filter)

    await loaders.loadNotesContext(getRelays(), notes, {loadParents: true})
  }

  const queryNotes = () => {
    return query.filterEvents({
      kinds: [1],
      since: cursor.since,
      muffle: getTagValues($user?.muffle || []),
    })
  }
</script>

<Notes shouldMuffle {loadNotes} {queryNotes} />
