<script>
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, Cursor, now, batch} from 'src/util/misc'
  import {getRelays, getMuffle, listen, load} from 'src/agent'
  import loaders from 'src/app/loaders'
  import query from 'src/app/query'

  const relays = getRelays()
  const filter = {kinds: [1, 5, 7]}
  const cursor = new Cursor(timedelta(1, 'minutes'))

  const listenForNotes = onNotes =>
    listen(relays, {...filter, since: now()}, batch(300, async notes => {
      const context = await loaders.loadContext(relays, notes)

      onNotes(query.threadify(notes, context, {muffle: getMuffle()}))
    }))

  const loadNotes = async () => {
    const [since, until] = cursor.step()
    const notes = await load(relays, {...filter, since, until})
    const context = await loaders.loadContext(relays, notes)

    return query.threadify(notes, context, {muffle: getMuffle()})
  }
</script>

<Notes {listenForNotes} {loadNotes} />
