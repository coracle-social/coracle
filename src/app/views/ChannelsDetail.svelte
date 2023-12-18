<script lang="ts">
  import cx from "classnames"
  import {onMount, onDestroy} from "svelte"
  import {formatTimestamp} from "src/util/misc"
  import {appName} from "src/partials/state"
  import Channel from "src/partials/Channel.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {router} from "src/app/router"
  import {
    session,
    channels,
    displayPubkey,
    createMessage,
    markChannelRead,
    listenForMessages,
    sortEventsDesc,
  } from "src/engine"

  export let channelId
  export let pubkeys

  const channel = channels.key(channelId)

  const showPerson = pubkey => router.at("people").of(pubkey).open()

  const sendMessage = content => {
    const [message] = sortEventsDesc($channel.messages || [])

    if (message?.kind === 4) {
      confirmMessage = content
    } else {
      createMessage(channelId, content)
    }
  }

  const cancel = () => {
    confirmMessage = null
  }

  const confirm = () => {
    createMessage(channelId, confirmMessage)
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

<Channel messages={$channel?.messages || []} {sendMessage}>
  <div slot="header" class="flex h-16 items-start gap-4 overflow-hidden p-1 px-4">
    <div class="flex items-center gap-4 pt-1">
      <Anchor class="fa fa-arrow-left cursor-pointer text-2xl" href="/channels" />
      <div class="mr-3 flex pt-1">
        {#each pubkeys as pubkey (pubkey)}
          <div class="-mr-3 inline-block">
            <PersonCircle class="h-10 w-10" {pubkey} />
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
      class="mt-1"
      class:text-cocoa={message.pubkey === $session.pubkey}
      class:text-lightest={message.pubkey !== $session.pubkey}>
      {formatTimestamp(message.created_at)}
    </small>
  </div>
</Channel>

{#if confirmMessage}
  <Modal>
    <Content size="lg">
      <p class="flex items-center gap-4 text-xl">
        <i class="fa fa-info-circle" /> Auto-upgrade notice
      </p>
      <p>
        {appName} only supports new-style DMs, but the most recent message in this conversation was sent
        using old-style DMs.
      </p>
      <p>
        You should make sure @{displayPubkey(pubkeys[0])} is using a NIP-44 compatible nostr client,
        or you can send an old-style message using <Anchor
          external
          underline
          href="https://nip04.coracle.social">nip04.coracle.social</Anchor
        >.
      </p>
      <p>Would you like to continue sending this message?</p>
      <div class="flex justify-center gap-2 py-4">
        <Anchor button on:click={cancel}>Cancel</Anchor>
        <Anchor button accent on:click={confirm}>Confirm</Anchor>
      </div>
    </Content>
  </Modal>
{/if}
