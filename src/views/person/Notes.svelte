<script>
  import Notes from "src/partials/Notes.svelte"
  import {now, batch, Cursor} from 'src/util/misc'
  import {getRelays, getMuffle} from 'src/agent/helpers'
  import network from 'src/agent/network'
  import {threadify} from 'src/app'

  export let pubkey

  const relays = getRelays(pubkey)
  const filter = {kinds: [1], authors: [pubkey]}
  const cursor = new Cursor()

  const listenForNotes = onNotes =>
    network.listen(relays, {...filter, since: now()}, batch(300, async notes => {
      const context = await network.loadContext(relays, notes)

      onNotes(threadify(notes, context, {muffle: getMuffle()}))
    }))

  const loadNotes = async () => {
    const {limit, until} = cursor
    const notes = await network.load(relays, {...filter, limit, until})
    const context = await network.loadContext(relays, notes)

    return threadify(notes, context, {muffle: getMuffle()})
  }
</script>

<Notes {listenForNotes} {loadNotes} />

