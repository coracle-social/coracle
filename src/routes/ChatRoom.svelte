<script lang="ts">
  import {pluck} from 'ramda'
  import {nip19} from 'nostr-tools'
  import {now, batch} from 'src/util/misc'
  import Channel from 'src/partials/Channel.svelte'
  import {getRelays, user} from 'src/agent/helpers'
  import database from 'src/agent/database'
  import network from 'src/agent/network'
  import {modal} from 'src/app'
  import cmd from 'src/agent/cmd'

  export let entity

  let {data: roomId} = nip19.decode(entity) as {data: string}
  let room = database.watch('rooms', rooms => rooms.get(roomId))

  const getRoomRelays = () => {
    let relays = getRelays()

    if ($room) {
      relays = relays.concat(getRelays($room.pubkey))
    }

    return relays
  }

  const listenForMessages = async cb => {
    const relays = getRoomRelays()

    return network.listen(
      relays,
      // Listen for updates to the room in case we didn't get them before
      [{kinds: [40, 41], ids: [roomId]},
       {kinds: [42], '#e': [roomId], since: now()}],
      batch(300, events => {
        const newMessages = events.filter(e => e.kind === 42)

        network.loadPeople(relays, pluck('pubkey', events))

        cb(newMessages)
      })
    )
  }

  const loadMessages = async ({until, limit}) => {
    const relays = getRoomRelays()
    const events = await network.load(relays, {kinds: [42], '#e': [roomId], until, limit})

    if (events.length) {
      await network.loadPeople(relays, pluck('pubkey', events))
    }

    return events
  }

  const editRoom = () => {
    modal.set({type: 'room/edit', room: $room})
  }

  const sendMessage = content =>
    cmd.createChatMessage(getRoomRelays(), roomId, content)
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
