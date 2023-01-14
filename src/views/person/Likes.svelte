<script>
  import Notes from "src/partials/Notes.svelte"
  import {now, batch, Cursor} from 'src/util/misc'
  import {load, listen, getRelays, getMuffle} from 'src/agent'
  import loaders from 'src/app/loaders'
  import {threadify} from 'src/app'

  export let pubkey

  const relays = getRelays(pubkey)
  const filter = {kinds: [7], authors: [pubkey]}
  const cursor = new Cursor()

  const listenForNotes = onNotes =>
    listen(relays, {...filter, since: now()}, batch(300, async notes => {
      const context = await loaders.loadContext(relays, notes)

      onNotes(threadify(notes, context, {muffle: getMuffle()}))
    }))

  const loadNotes = async () => {
    const {limit, until} = cursor
    const notes = await load(relays, {...filter, limit, until})
    const context = await loaders.loadContext(relays, notes)

    return threadify(notes, context, {muffle: getMuffle()})
  }
</script>

<Notes {listenForNotes} {loadNotes} />

