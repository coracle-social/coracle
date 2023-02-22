<script lang="ts">
  import {pluck} from 'ramda'
  import {now} from 'src/util/misc'
  import {toHex} from 'src/util/nostr'
  import Channel from 'src/partials/Channel.svelte'
  import user from 'src/agent/user'
  import {getRelaysForEventChildren} from 'src/agent/relays'
  import database from 'src/agent/database'
  import network from 'src/agent/network'
  import {modal} from 'src/app/ui'
  import cmd from 'src/agent/cmd'

  export let entity

  const roomId = toHex(entity)
  const room = database.watch('rooms', rooms => rooms.get(roomId))

  const listenForMessages = async cb => {
    // Listen for updates to the room in case we didn't get them before
    return network.listen({
      relays: getRelaysForEventChildren($room),
      filter: [
        {kinds: [40, 41], ids: [roomId]},
        {kinds: [42], '#e': [roomId], since: now()},
      ],
      onChunk: events => {
        network.loadPeople(pluck('pubkey', events))

        cb(events.filter(e => e.kind === 42))
      },
    })
  }

  const loadMessages = ({until, limit}, onChunk) => {
    network.load({
      relays: getRelaysForEventChildren($room),
      filter: {kinds: [42], '#e': [roomId], until, limit},
      onChunk: events => {
        network.loadPeople(pluck('pubkey', events))

        onChunk(events)
      },
    })
  }

  const editRoom = () => {
    modal.set({type: 'room/edit', room: $room})
  }

  const sendMessage = content =>
    cmd.createChatMessage(getRelaysForEventChildren($room), roomId, content)
</script>

<Channel
  type="chat"
  name={$room?.name}
  about={$room?.about}
  picture={$room?.picture}
  editRoom={$room?.pubkey === user.getPubkey() && editRoom}
  {loadMessages}
  {listenForMessages}
  {sendMessage}
/>
