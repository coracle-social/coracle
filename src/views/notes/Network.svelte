<script>
  import {uniqBy, prop} from 'ramda'
  import Notes from "src/partials/Notes.svelte"
  import {now, Cursor, shuffle, batch} from 'src/util/misc'
  import {user, getRelays, getFollows, getMuffle, listen, load} from 'src/agent'
  import loaders from 'src/app/loaders'
  import {threadify} from 'src/app'

  // Get first- and second-order follows. shuffle and slice network so we're not
  // sending too many pubkeys. This will also result in some variety.
  const follows = shuffle(getFollows($user?.pubkey))
  const network = shuffle(follows.flatMap(getFollows)).slice(0, 50)
  const authors = follows.concat(network).slice(0, 100)
  const filter = {kinds: [1, 7], authors}
  const cursor = new Cursor()
  const relays = uniqBy(prop('url'), follows.flatMap(getRelays))

  const listenForNotes = onNotes =>
    listen(relays, {...filter, since: now()}, batch(300, async notes => {
      const context = await loaders.loadContext(relays, notes)

      onNotes(threadify(notes, context, {muffle: getMuffle()}))
    }))

  const loadNotes = async () => {
    const {limit, until} = cursor
    const notes = await load(relays, {...filter, limit, until}, {mode: 'fast'})
    const context = await loaders.loadContext(relays, notes)

    cursor.onChunk(notes)

    return threadify(notes, context, {muffle: getMuffle()})
  }
</script>

<Notes {listenForNotes} {loadNotes} />

