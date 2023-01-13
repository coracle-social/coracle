<script>
  import Notes from "src/partials/Notes.svelte"
  import {now, Cursor, shuffle, batch} from 'src/util/misc'
  import {user, getRelays, getFollows, getMuffle, listen, load} from 'src/agent'
  import loaders from 'src/app/loaders'
  import query from 'src/app/query'

  // Get first- and second-order follows. shuffle and slice network so we're not
  // sending too many pubkeys. This will also result in some variety.
  const relays = getRelays()
  const follows = getFollows($user?.pubkey)
  const network = shuffle(follows.flatMap(getFollows)).slice(0, 50)
  const authors = follows.concat(network)
  const filter = {kinds: [1, 7], authors}
  const cursor = new Cursor()

  const listenForNotes = onNotes =>
    listen(relays, {...filter, since: now()}, batch(300, async notes => {
      const context = await loaders.loadContext(relays, notes)

      onNotes(query.threadify(notes, context, {muffle: getMuffle()}))
    }))

  const loadNotes = async () => {
    const {limit, until} = cursor
    const notes = await load(relays, {...filter, limit, until})
    const context = await loaders.loadContext(relays, notes)

    cursor.onChunk(notes)

    return query.threadify(notes, context, {muffle: getMuffle()})
  }
</script>

<Notes {listenForNotes} {loadNotes} />

