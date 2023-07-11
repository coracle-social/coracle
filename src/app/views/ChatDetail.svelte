<script lang="ts">
  import {onMount} from "svelte"
  import {now, formatTimestamp} from "src/util/misc"
  import {toHex} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Channel from "src/partials/Channel.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {builder, chat, user, routing, network} from "src/app/system"

  export let entity

  const id = toHex(entity)
  const channel = chat.channels.watch(() => chat.channels.get(id) || {id})
  const getRelays = () => routing.selectHints(user.getSetting("relay_limit"), $channel.hints || [])

  user.setLastChecked(id, now())

  const edit = () => {
    modal.push({type: "channel/edit", channel: $channel})
  }

  const sendMessage = async content => {
    const [hint] = getRelays()

    await user.publish(builder.createChatMessage(id, content, hint), getRelays())
  }

  onMount(() => {
    return network.subscribe({
      relays: getRelays(),
      filter: [{kinds: [42], "#e": [id]}],
    })
  })

  document.title = $channel.name || "Coracle Chat"
</script>

<Channel {id} {sendMessage}>
  <div slot="header" class="flex items-start gap-4 p-4">
    <div class="flex items-center gap-4">
      <Anchor class="fa fa-arrow-left cursor-pointer text-2xl" href="/chat" />
      <div
        class="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-solid border-white bg-cover bg-center"
        style="background-image: url({$channel.picture})" />
    </div>
    <div class="flex w-full flex-col gap-2">
      <div class="flex w-full items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="text-lg font-bold">{$channel.name || ""}</div>
          {#if $channel.pubkey === user.getPubkey()}
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
      <div>{$channel.about || ""}</div>
    </div>
  </div>
  <div slot="message" let:message>
    {#if message.showProfile}
      <div class="flex items-center justify-between gap-4">
        <PersonBadge pubkey={message.pubkey} />
        <p class="text-sm text-gray-1">{formatTimestamp(message.created_at)}</p>
      </div>
    {/if}
    <div class="my-1 ml-6 overflow-hidden text-ellipsis">
      <NoteContent showEntire note={message} />
    </div>
  </div>
</Channel>
