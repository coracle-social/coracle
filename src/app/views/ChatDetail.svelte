<script lang="ts">
  import {now, formatTimestamp} from "src/util/misc"
  import {toHex} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Channel from "src/partials/Channel.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import user from "src/agent/user"
  import {getRelaysForEventChildren, sampleRelays} from "src/agent/relays"
  import network from "src/agent/network"
  import {watch} from "src/agent/db"
  import cmd from "src/agent/cmd"

  export let entity

  const id = toHex(entity)
  const room = watch("rooms", t => t.get(id) || {id})
  const getRelays = () => sampleRelays($room ? getRelaysForEventChildren($room) : [])
  const cursor = new network.Cursor({relays: getRelays()})

  user.setLastChecked(`chat/${id}`, now())

  const listenForMessages = onChunk =>
    network.listen({
      relays: getRelays(),
      filter: [{kinds: [42], "#e": [id], since: now()}],
      onChunk,
    })

  const loadMessages = onChunk => cursor.loadPage({filter: {kinds: [42], "#e": [id]}, onChunk})

  const edit = () => {
    modal.push({type: "room/edit", room: $room})
  }

  const sendMessage = async content => {
    const [{url}] = getRelays()
    const [event] = await cmd.createChatMessage(id, content, url).publish(getRelays())

    return event
  }

  document.title = $room.name
</script>

<Channel {loadMessages} {listenForMessages} {sendMessage}>
  <div slot="header" class="flex items-start gap-4 p-4">
    <div class="flex items-center gap-4">
      <Anchor class="fa fa-arrow-left cursor-pointer text-2xl" href="/chat" />
      <div
        class="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-solid border-white bg-cover bg-center"
        style="background-image: url({$room.picture})" />
    </div>
    <div class="flex w-full flex-col gap-2">
      <div class="flex w-full items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="text-lg font-bold">{$room.name || ""}</div>
          {#if $room?.pubkey === user.getPubkey()}
            <button class="cursor-pointer text-sm" on:click={edit}>
              <i class="fa-solid fa-edit" /> Edit
            </button>
          {/if}
        </div>
        <div class="flex items-center gap-2">
          <i class="fa fa-lock-open text-gray-1" />
          <span class="text-gray-1">Public</span>
        </div>
      </div>
      <div>{$room.about || ""}</div>
    </div>
  </div>
  <div slot="message" let:message>
    {#if message.showProfile}
      <div class="flex items-center justify-between gap-4">
        <PersonBadge pubkey={message.person.pubkey} />
        <p class="text-sm text-gray-1">{formatTimestamp(message.created_at)}</p>
      </div>
    {/if}
    <div class="my-1 ml-6 overflow-hidden text-ellipsis">
      <NoteContent showEntire note={message} />
    </div>
  </div>
</Channel>
