<script lang="ts">
  import cx from "classnames"
  import {derived} from "svelte/store"
  import {onMount, onDestroy} from "svelte"
  import {deriveEvents} from "@welshman/store"
  import {DIRECT_MESSAGE} from "@welshman/util"
  import {formatTimestamp} from "src/util/misc"
  import Channel from "src/partials/Channel.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {router} from "src/app/util/router"
  import {
    session,
    hasNip44,
    repository,
    displayProfileByPubkey,
    sendMessage,
    sendLegacyMessage,
    markChannelRead,
    getChannelIdFromEvent,
    listenForMessages,
    ensureMessagePlaintext,
  } from "src/engine"

  export let pubkeys
  export let channelId
  export let initialMessage = null

  const messages = derived(
    deriveEvents(repository, {
      filters: [{kinds: [4, DIRECT_MESSAGE], authors: pubkeys, "#p": pubkeys}],
    }),
    $events => $events.filter(e => getChannelIdFromEvent(e) === channelId),
  )

  const showPerson = pubkey => router.at("people").of(pubkey).open()

  const getContent = e => (e.kind === 4 ? ensureMessagePlaintext(e) : e.content) || ""

  const send = async (content, useNip17) => {
    // If we don't have nip44 support, just send a legacy message
    if (!$hasNip44 || !useNip17) {
      return sendLegacyMessage(channelId, content)
    }

    await sendMessage(channelId, content)
  }

  onMount(() => {
    markChannelRead(channelId)

    return listenForMessages(pubkeys)
  })

  onDestroy(() => {
    markChannelRead(channelId)
  })

  document.title = `Direct Messages`
</script>

<Channel {pubkeys} messages={$messages} sendMessage={send} {initialMessage}>
  <div slot="header" class="flex h-16 items-start gap-4 overflow-hidden p-1 px-4">
    <div class="flex items-center gap-4 pt-1">
      <Anchor class="fa fa-arrow-left cursor-pointer text-2xl" href="/channels" />
      <PersonCircles {pubkeys} />
    </div>
    <div class="flex h-12 w-full flex-col overflow-hidden pt-1">
      <div class="w-full">
        {#each pubkeys as pubkey, i (pubkey)}
          {#if i > 0}&bullet;{/if}
          <Anchor class="hover:underline" on:click={() => showPerson(pubkey)}>
            {displayProfileByPubkey(pubkey)}
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
      "ml-12 justify-self-end rounded-br-none bg-neutral-100 text-neutral-800":
        message.pubkey === $session.pubkey,
      "mr-12 rounded-bl-none bg-tinted-800": message.pubkey !== $session.pubkey,
    })}>
    {#if message.showProfile && message.pubkey !== $session.pubkey}
      <Anchor class="mb-1" on:click={() => showPerson(message.pubkey)}>
        <strong>{displayProfileByPubkey(message.pubkey)}</strong>
      </Anchor>
    {/if}
    <div class="break-words">
      {#await getContent(message)}
        <!-- pass -->
      {:then content}
        <NoteContent showEntire note={{...message, content}} />
      {/await}
    </div>
    <small
      class="mt-1 flex items-center justify-between gap-2"
      class:text-tinted-700={message.pubkey === $session.pubkey}
      class:text-neutral-100={message.pubkey !== $session.pubkey}>
      {formatTimestamp(message.created_at)}
      {#if message.kind === 4}
        <Popover triggerType="mouseenter">
          <i slot="trigger" class="fa fa-unlock cursor-pointer text-neutral-400" />
          <p slot="tooltip">
            This message was sent using nostr's legacy DMs, which have a number of shortcomings.
            Read more <Anchor underline modal href="/help/nip-44-dms">here</Anchor>.
          </p>
        </Popover>
      {:else}
        <Popover triggerType="mouseenter">
          <i slot="trigger" class="fa fa-lock cursor-pointer text-neutral-400" />
          <div slot="tooltip" class="flex flex-col gap-2">
            <p>
              This message was sent using nostr's new group chat specification, which solves several
              problems with legacy DMs. Read more <Anchor underline modal href="/help/nip-44-dms"
                >here</Anchor
              >.
            </p>
            {#if message.pubkey === $session.pubkey}
              <p>
                Note that these messages are not yet universally supported. Make sure the person
                you're chatting with is using a compatible nostr client.
              </p>
            {/if}
          </div>
        </Popover>
      {/if}
    </small>
  </div>
</Channel>
