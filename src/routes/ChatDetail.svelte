<script lang="ts">
  import {assoc} from "ramda"
  import {updateIn} from "hurdak/lib/hurdak"
  import {now, formatTimestamp} from "src/util/misc"
  import {toHex} from "src/util/nostr"
  import Channel from "src/partials/Channel.svelte"
  import Badge from "src/partials/Badge.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import user from "src/agent/user"
  import {getRelaysForEventChildren, sampleRelays} from "src/agent/relays"
  import network from "src/agent/network"
  import {watch} from "src/agent/table"
  import cmd from "src/agent/cmd"
  import {modal} from "src/app/ui"
  import {lastChecked} from "src/app/alerts"
  import {renderNote} from "src/app"

  export let entity

  const id = toHex(entity)
  const room = watch("rooms", t => t.get(id) || {id})
  const getRelays = () => sampleRelays($room ? getRelaysForEventChildren($room) : [])

  const listenForMessages = onChunk =>
    network.listen({
      relays: getRelays(),
      filter: [{kinds: [42], "#e": [id], since: now()}],
      onChunk,
    })

  const loadMessages = (cursor, onChunk) =>
    network.load({
      relays: getRelays(),
      filter: {kinds: [42], "#e": [id], ...cursor.getFilter()},
      onChunk,
    })

  const edit = () => {
    modal.set({type: "room/edit", room: $room})
  }

  const sendMessage = async content => {
    const [{url}] = getRelays()
    const [event] = await cmd.createChatMessage(id, content, url).publish(getRelays())

    return event
  }

  document.title = $room.name

  lastChecked.update(updateIn(assoc(id, now())))
</script>

<Channel {loadMessages} {listenForMessages} {sendMessage}>
  <div slot="header" class="flex items-start gap-4">
    <div class="flex items-center gap-4">
      <Anchor type="unstyled" class="fa fa-arrow-left cursor-pointer text-2xl" href="/chat" />
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
          <i class="fa fa-lock-open text-light" />
          <span class="text-light">Public</span>
        </div>
      </div>
      <div>{$room.about || ""}</div>
    </div>
  </div>
  <div slot="message" let:message>
    {#if message.showPerson}
      <div class="flex items-center justify-between gap-4">
        <Badge person={message.person} />
        <p class="text-sm text-light">{formatTimestamp(message.created_at)}</p>
      </div>
    {/if}
    <div class="my-1 ml-6 overflow-hidden text-ellipsis">
      {@html renderNote(message, {showEntire: true})}
    </div>
  </div>
</Channel>
