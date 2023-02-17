<script lang="ts">
  import {pluck} from 'ramda'
  import {nip19} from 'nostr-tools'
  import {now} from 'src/util/misc'
  import Channel from 'src/partials/Channel.svelte'
  import user from 'src/agent/user'
  import {getRelaysForEventChildren} from 'src/agent/relays'
  import database from 'src/agent/database'
  import network from 'src/agent/network'
  import {modal} from 'src/app/ui'
  import cmd from 'src/agent/cmd'

  export let entity

  const {data: roomId} = nip19.decode(entity) as {data: string}
  const room = database.watch('rooms', rooms => rooms.get(roomId))

  const listenForMessages = async cb => {
    const relays = getRelaysForEventChildren($room)

    return network.listen(
      relays,
      // Listen for updates to the room in case we didn't get them before
      [{kinds: [40, 41], ids: [roomId]},
       {kinds: [42], '#e': [roomId], since: now()}],
      events => {
        network.loadPeople(pluck('pubkey', events))

        cb(events.filter(e => e.kind === 42))
      }
    )
  }

  const loadMessages = async ({until, limit}) => {
    const relays = getRelaysForEventChildren($room)
    const events = await network.load(relays, {kinds: [42], '#e': [roomId], until, limit})

    network.loadPeople(pluck('pubkey', events))

    return events
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
