<script>
  import Notes from "src/partials/Notes.svelte"
  import {Cursor, now, batch} from 'src/util/misc'
  import {getUserRelays, getMuffle} from 'src/agent/helpers'
  import network from 'src/agent/network'
  import {threadify} from 'src/app'

  const relays = getUserRelays('read')
  const filter = {kinds: [1, 5, 7]}
  const cursor = new Cursor()

  const listenForNotes = onNotes =>
    network.listen(relays, {...filter, since: now()}, batch(300, async notes => {
      const context = await network.loadContext(relays, notes)

      onNotes(threadify(notes, context, {muffle: getMuffle(), showReplies: false}))
    }))

  const loadNotes = async () => {
    const {limit, until} = cursor
    const notes = await network.load(relays, {...filter, limit, until})
    const context = await network.loadContext(relays, notes)

    cursor.onChunk(notes)

    return threadify(notes, context, {muffle: getMuffle(), showReplies: false})
  }
</script>

<Notes {listenForNotes} {loadNotes} />
