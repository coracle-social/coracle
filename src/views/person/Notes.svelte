<script>
  import Notes from "src/partials/Notes.svelte"
  import {timedelta, now, batch, Cursor} from 'src/util/misc'
  import {load, listen, getRelays, getMuffle} from 'src/agent'
  import loaders from 'src/app/loaders'
  import query from 'src/app/query'

  export let pubkey

  const relays = getRelays(pubkey)
  const filter = {kinds: [1], authors: [pubkey]}
  const cursor = new Cursor(timedelta(1, 'days'))

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

