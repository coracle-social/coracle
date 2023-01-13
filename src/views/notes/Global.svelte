<script>
  import Notes from "src/partials/Notes.svelte"
  import {Cursor, now, batch} from 'src/util/misc'
  import {getRelays, getMuffle, listen, load} from 'src/agent'
  import loaders from 'src/app/loaders'
  import query from 'src/app/query'

  const relays = getRelays()
  const filter = {kinds: [1, 5, 7]}
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

    console.log('========')
    console.log({notes, context})
    console.log(query.threadify(notes, context, {muffle: getMuffle()}))

    return query.threadify(notes, context, {muffle: getMuffle()})
  }
</script>

<Notes {listenForNotes} {loadNotes} />
