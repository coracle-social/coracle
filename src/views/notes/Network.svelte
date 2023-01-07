<script>
  import {when, identity, nth, propEq} from 'ramda'
  import {onMount} from 'svelte'
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, shuffle, Cursor} from 'src/util/misc'
  import {getTagValues} from 'src/util/nostr'
  import {user, getPerson, listen, load} from 'src/agent'
  import {getRelays} from 'src/app'
  import defaults from 'src/app/defaults'
  import loaders from 'src/app/loaders'
  import query from 'src/app/query'

  const getFollows = pubkey => {
    const person = getPerson(pubkey)
    const petnames = person?.petnames || defaults.petnames

    return petnames.map(nth(1))
  }

  // Get first- and second-order follows. shuffle and slice network so we're not
  // sending too many pubkeys. This will also result in some variety.
  const follows = getFollows($user?.pubkey)
  const network = shuffle(follows.flatMap(getFollows)).slice(0, 50)
  const authors = follows.concat(network)

  onMount(() => {
    const sub = listen(
      getRelays(),
      [{kinds: [1, 5, 7], authors, since: cursor.since}],
      when(propEq('kind', 1), e => {
        loaders.loadNotesContext(getRelays(), e)
      })
    )

    return () => {
      sub.then(s => s.unsub())
    }
  })

  const cursor = new Cursor(timedelta(20, 'minutes'))

  const loadNotes = async () => {
    const [since, until] = cursor.step()
    const filter = {kinds: [1, 7], authors, since, until}
    const notes = await load(getRelays(), filter)

    await loaders.loadNotesContext(getRelays(), notes, {loadParents: true})
  }

  const queryNotes = () => {
    return query.filterEvents({
      kinds: [1],
      since: cursor.since,
      authors: authors.concat($user?.pubkey).filter(identity),
      muffle: getTagValues($user?.muffle || []),
    })
  }
</script>

<Notes shouldMuffle {loadNotes} {queryNotes} />

