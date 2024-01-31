<script lang="ts">
  import cx from "classnames"
  import {onMount, onDestroy} from "svelte"
  import {formatTimestamp} from "src/util/misc"
  import Channel from "src/partials/Channel.svelte"
  import Content from "src/partials/Content.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {router} from "src/app/router"
  import {
    nip44,
    session,
    channels,
    displayPubkey,
    sendMessage,
    sendLegacyMessage,
    markChannelRead,
    listenForMessages,
    sortEventsDesc,
  } from "src/engine"

  export let pubkeys
  export let channelId
  export let initialMessage = null

  const channel = channels.key(channelId)

  const showPerson = pubkey => router.at("people").of(pubkey).open()

  const send = (content, useNip44) => {
    // If we don't have nip44 support, just send a legacy message
    if (!$nip44.isEnabled() || !useNip44) {
      return sendLegacyMessage(channelId, content)
    }

    const [message] = sortEventsDesc($channel.messages || [])

    if (!message || message?.kind === 4) {
      confirmMessage = content
    } else {
      sendMessage(channelId, content)
    }
  }

  const confirmNip04 = () => {
    sendLegacyMessage(channelId, confirmMessage)
    confirmMessage = null
  }

  const confirmNip44 = () => {
    sendMessage(channelId, confirmMessage)
    confirmMessage = null
  }

  const abortMessage = () => {
    confirmMessage = null
  }

  let confirmMessage

  onMount(() => {
    markChannelRead(channelId)

    const sub = listenForMessages(pubkeys)

    return () => sub.close()
  })

  onDestroy(() => {
    markChannelRead(channelId)
  })

  document.title = `Direct Messages`
</script>

<Channel {pubkeys} messages={$channel?.messages || []} sendMessage={send} {initialMessage}>
  <div slot="header" class="flex h-16 items-start gap-4 overflow-hidden p-1 px-4">
    <div class="flex items-center gap-4 pt-1">
      <Anchor class="fa fa-arrow-left cursor-pointer text-2xl" href="/channels" />
      <div class="mr-3 flex pt-1">
        {#each pubkeys as pubkey (pubkey)}
          <div class="-mr-3 inline-block">
            <PersonCircle class="h-10 w-10 border-2 border-solid border-dark-d" {pubkey} />
          </div>
        {/each}
      </div>
    </div>
    <div class="flex h-12 w-full flex-col overflow-hidden pt-1">
      <div class="w-full">
        {#each pubkeys as pubkey, i (pubkey)}
          {#if i > 0}&bullet;{/if}
          <Anchor class="hover:underline" on:click={() => showPerson(pubkey)}>
            {displayPubkey(pubkey)}
          </Anchor>
        {/each}
      </div>
      {#if pubkeys.length === 1}
        <PersonAbout truncate pubkey={pubkeys[0]} />
      {/if}
    </div>
  </div>
  <div
    slot="message"
    let:message
    class={cx("max-w-xl rounded-2xl px-4 py-2", {
      "ml-12 justify-self-end rounded-br-none bg-lightest text-dark":
        message.pubkey === $session.pubkey,
      "mr-12 rounded-bl-none bg-cocoa": message.pubkey !== $session.pubkey,
    })}>
    {#if message.showProfile && message.pubkey !== $session.pubkey}
      <Anchor class="mb-1" on:click={() => showPerson(message.pubkey)}>
        <strong>{displayPubkey(message.pubkey)}</strong>
      </Anchor>
    {/if}
    <div class="break-words">
      {#if typeof message.content === "string"}
        <NoteContent showEntire note={message} />
      {/if}
    </div>
    <small
      class="mt-1 flex items-center justify-between gap-2"
      class:text-cocoa={message.pubkey === $session.pubkey}
      class:text-lightest={message.pubkey !== $session.pubkey}>
      {formatTimestamp(message.created_at)}
      {#if message.kind === 4}
        <Popover>
          <i slot="trigger" class="fa fa-unlock cursor-pointer text-lighter" />
          <p slot="tooltip">
            This message was sent using nostr's legacy DMs, which have a number of shortcomings.
            Read more <Anchor underline modal href="/help/nip-44-dms">here</Anchor>.
          </p>
        </Popover>
      {:else}
        <Popover>
          <i slot="trigger" class="fa fa-lock cursor-pointer text-lighter" />
          <div slot="tooltip" class="flex flex-col gap-2">
            <p>
              This message was sent using nostr's new group chat specification, which solves several
              problems with legacy DMs. Read more <Anchor
                underline
                external
                href="https://habla.news/u/hodlbod@coracle.social/0gmn3DDizCIesG-PCD-JK"
                >here</Anchor
              >.
            </p>
            <p>
              Note that these messages are not yet universally supported. Make sure the person
              you're chatting with is using a compatible nostr client.
            </p>
          </div>
        </Popover>
      {/if}
    </small>
  </div>
</Channel>

{#if confirmMessage}
  <Modal onEscape={abortMessage}>
    <Content size="lg">
      <p class="flex items-center gap-4 text-xl">
        <i class="fa fa-info-circle" /> Auto-upgrade notice
      </p>
      <p>
        This conversation has not yet been upgraded to use <Anchor
          underline
          modal
          href="/help/nip-44-dms">new-style DMs</Anchor
        >.
      </p>
      <p>
        You should make sure @{displayPubkey(pubkeys[0])} is using a compatible nostr client, or you
        can choose to send an old-style message instead.
      </p>
      <p>How would you like to send this message?</p>
      <div class="flex flex-col gap-2 py-4 sm:flex-row">
        <Anchor button on:click={confirmNip04}>Send using Legacy DMs</Anchor>
        <Anchor button accent on:click={confirmNip44}>Send using NIP 44</Anchor>
      </div>
    </Content>
  </Modal>
{/if}
