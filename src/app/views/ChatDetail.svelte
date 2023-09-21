<script lang="ts">
  import {onMount, onDestroy} from "svelte"
  import {assoc} from "ramda"
  import {formatTimestamp} from "src/util/misc"
  import {toHex} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Channel from "src/partials/Channel.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {
    canSign,
    session,
    channels,
    imgproxy,
    publishNip28Message,
    joinNip28Channel,
    leaveNip28Channel,
    listenForNip28Messages,
    publishNip28ChannelChecked,
  } from "src/engine"

  export let entity

  const id = toHex(entity)
  const channel = channels.key(id)

  publishNip28ChannelChecked(id)

  const join = () => joinNip28Channel(id)

  const leave = () => leaveNip28Channel(id)

  const edit = () => modal.push({type: "chat/edit", channel: $channel})

  const sendMessage = async content => {
    const pub = await publishNip28Message(id, content)

    return pub.result
  }

  onMount(() => {
    const sub = listenForNip28Messages(id)

    return () => sub.close()
  })

  onDestroy(() => {
    publishNip28ChannelChecked(id)

    // Save on memory by deleting messages we don't care about
    if (!$channel?.nip28?.joined) {
      channel.update(assoc("messages", []))
    }
  })

  $: picture = imgproxy($channel?.meta?.picture, {w: 96, h: 96})

  document.title = $channel?.meta?.name || "Coracle Chat"
</script>

<Channel messages={$channel?.messages || []} {sendMessage}>
  <div slot="header" class="flex h-16 items-start gap-4 overflow-hidden p-2">
    <div class="flex items-center gap-4 pt-1">
      <Anchor type="unstyled" class="fa fa-arrow-left cursor-pointer text-2xl" href="/chat" />
      <ImageCircle size={10} src={picture} />
    </div>
    <div class="flex h-12 flex-grow flex-col overflow-hidden pt-px">
      <div class="font-bold">{$channel?.meta?.name || ""}</div>
      <div>{$channel?.meta?.about || ""}</div>
    </div>
    <div class="flex h-12 flex-col pt-px">
      <div class="flex w-full items-center justify-between">
        <div class="flex gap-2">
          {#if $channel?.nip28?.owner === $session?.pubkey}
            <button class="cursor-pointer text-sm" on:click={edit}>
              <i class="fa-solid fa-edit" /> Edit
            </button>
          {/if}
          {#if $channel?.nip28?.joined}
            <Anchor theme="button" killEvent class="flex items-center gap-2" on:click={leave}>
              <i class="fa fa-right-from-bracket" />
              <span>Leave</span>
            </Anchor>
          {:else if $canSign}
            <Anchor theme="button" killEvent class="flex items-center gap-2" on:click={join}>
              <i class="fa fa-right-to-bracket" />
              <span>Join</span>
            </Anchor>
          {/if}
        </div>
      </div>
    </div>
  </div>
  <div slot="message" let:message>
    {#if message.showProfile}
      <div class="flex items-center justify-between gap-4">
        <PersonBadgeSmall pubkey={message.pubkey} />
        <p class="text-sm text-gray-1">{formatTimestamp(message.created_at)}</p>
      </div>
    {/if}
    <div class="my-1 ml-6 overflow-hidden text-ellipsis">
      <NoteContent showEntire note={message} />
    </div>
  </div>
</Channel>
