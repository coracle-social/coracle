<script>
  import {liveQuery} from 'dexie'
  import {pluck} from 'ramda'
  import {nip19} from 'nostr-tools'
  import {now, batch} from 'src/util/misc'
  import Channel from 'src/partials/Channel.svelte'
  import {getRelays, user, db, listen, load} from 'src/agent'
  import {modal} from 'src/app'
  import loaders from 'src/app/loaders'
  import cmd from 'src/app/cmd'

  export let entity

  let {data: roomId} = nip19.decode(entity)
  let room = liveQuery(() => db.rooms.where('id').equals(roomId).first())

  const getRoomRelays = $room => {
    let relays = getRelays()

    if ($room) {
      relays = relays.concat(getRelays($room.pubkey))
    }

    return relays
  }

  const listenForMessages = async cb => {
    // Make sure we have our room so we can calculate relays
    const $room = await db.rooms.where('id').equals(roomId).first()
    const relays = getRoomRelays($room)

    return listen(
      relays,
      // Listen for updates to the room in case we didn't get them before
      [{kinds: [40, 41], ids: [roomId]},
       {kinds: [42], '#e': [roomId], since: now()}],
      batch(300, events => {
        const newMessages = events.filter(e => e.kind === 42)

        loaders.loadPeople(relays, pluck('pubkey', events))

        cb(newMessages)
      })
    )
  }

  const loadMessages = async ({until, limit}) => {
    const relays = getRoomRelays($room)
    const events = await load(relays, {kinds: [42], '#e': [roomId], until, limit})

    if (events.length) {
      await loaders.loadPeople(relays, pluck('pubkey', events))
    }

    return events
  }

  const editRoom = () => {
    modal.set({type: 'room/edit', room: $room})
  }

  const sendMessage = content =>
    cmd.createChatMessage(getRelays(), roomId, content)
</script>

<Channel
  type="chat"
  name={$room?.name}
  about={$room?.about}
  picture={$room?.picture}
  editRoom={$room?.pubkey === $user.pubkey && editRoom}
  {loadMessages}
  {listenForMessages}
  {sendMessage}
/>
