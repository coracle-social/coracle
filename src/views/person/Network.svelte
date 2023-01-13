<script>
  import Notes from "src/partials/Notes.svelte"
  import {now, shuffle, batch, Cursor} from 'src/util/misc'
  import {getRelays, getFollows, getMuffle, listen, load} from 'src/agent'
  import loaders from 'src/app/loaders'
  import query from 'src/app/query'

  export let pubkey

  const relays = getRelays(pubkey)
  const follows = getFollows(pubkey)
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

    return query.threadify(notes, context, {muffle: getMuffle()})
  }
</script>

<Notes {listenForNotes} {loadNotes} />
