<script lang="ts">
  import {assoc} from 'ramda'
  import {updateIn} from 'hurdak/lib/hurdak'
  import {now, formatTimestamp} from 'src/util/misc'
  import {toHex} from 'src/util/nostr'
  import Channel from 'src/partials/Channel.svelte'
  import Badge from 'src/partials/Badge.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import user from 'src/agent/user'
  import {getRelaysForEventChildren, sampleRelays} from 'src/agent/relays'
  import network from 'src/agent/network'
  import database from 'src/agent/database'
  import cmd from 'src/agent/cmd'
  import {modal} from 'src/app/ui'
  import {lastChecked} from 'src/app/alerts'
  import {renderNote} from 'src/app'

  export let entity

  const id = toHex(entity)
  const room = database.watch('rooms', t => t.get(id) || {id})
  const getRelays = () => sampleRelays($room ? getRelaysForEventChildren($room) : [])

  const listenForMessages = onChunk =>
    network.listen({
      relays: getRelays(),
      filter: [{kinds: [42], '#e': [id], since: now()}],
      onChunk,
    })

  const loadMessages = (cursor, onChunk) =>
    network.load({
      relays: getRelays(),
      filter: {kinds: [42], '#e': [id], ...cursor.getFilter()},
      onChunk,
    })

  const edit = () => {
    modal.set({type: 'room/edit', room: $room})
  }

  const sendMessage = async content => {
    const [{url}] = getRelays()
    const [event] = await cmd.createChatMessage(id, content, url).publish(getRelays())

    return event
  }

  lastChecked.update(updateIn(assoc(id, now())))
</script>

<Channel {loadMessages} {listenForMessages} {sendMessage}>
  <div slot="header" class="flex gap-4 items-start">
    <div class="flex items-center gap-4">
      <Anchor type="unstyled" class="fa fa-arrow-left text-2xl cursor-pointer" href="/chat" />
      <div
        class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
        style="background-image: url({$room.picture})" />
    </div>
    <div class="w-full flex flex-col gap-2">
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-4">
          <div class="text-lg font-bold">{$room.name || ''}</div>
          {#if $room?.pubkey === user.getPubkey()}
          <button class="text-sm cursor-pointer" on:click={edit}>
            <i class="fa-solid fa-edit" /> Edit
          </button>
          {/if}
        </div>
        <div class="flex items-center gap-2">
          <i class="fa fa-lock-open text-light" />
          <span class="text-light">Public</span>
        </div>
      </div>
      <div>{$room.about || ''}</div>
    </div>
  </div>
  <div slot="message" let:message>
    {#if message.showPerson}
    <div class="flex gap-4 items-center justify-between">
      <Badge person={message.person} />
      <p class="text-sm text-light">{formatTimestamp(message.created_at)}</p>
    </div>
    {/if}
    <div class="overflow-hidden text-ellipsis ml-6 my-1">
      {@html renderNote(message, {showEntire: true})}
    </div>
  </div>
</Channel>
