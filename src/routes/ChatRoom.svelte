<script lang="ts">
  import {pluck} from 'ramda'
  import {nip19} from 'nostr-tools'
  import {now, batch} from 'src/util/misc'
  import Channel from 'src/partials/Channel.svelte'
  import {getEventRelays, user} from 'src/agent/helpers'
  import database from 'src/agent/database'
  import network from 'src/agent/network'
  import {modal} from 'src/app'
  import cmd from 'src/agent/cmd'

  export let entity

  const {data: roomId} = nip19.decode(entity) as {data: string}
  const room = database.watch('rooms', rooms => rooms.get(roomId))

  const listenForMessages = async cb => {
    const relays = getEventRelays($room)

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
    const relays = getEventRelays($room)
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
    cmd.createChatMessage(getEventRelays($room), roomId, content)
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
