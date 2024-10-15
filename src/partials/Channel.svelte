<script lang="ts">
  import cx from "classnames"
  import {onMount} from "svelte"
  import {pluralize} from "hurdak"
  import {derived} from "svelte/store"
  import {sleep, remove} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {Nip46Signer} from "@welshman/signer"
  import {
    session,
    signer,
    displayProfileByPubkey,
    inboxRelaySelectionsByPubkey,
  } from "@welshman/app"
  import {prop, max, reverse, pluck, sortBy, last} from "ramda"
  import {fly, slide} from "src/util/transition"
  import {createScroller, displayList, formatTimestamp} from "src/util/misc"
  import Spinner from "src/partials/Spinner.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import PersonBadgeMedium from "src/app/shared/PersonBadgeMedium.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {hasNip44, ensureMessagePlaintext} from "src/engine"

  export let pubkeys
  export let sendMessage
  export let initialMessage = ""
  export let messages: TrustedEvent[]

  const loading = sleep(5_000)
  const toggleScale = 0.7

  const startScroller = () => {
    scroller?.stop()
    scroller = createScroller(loadMore, {element, reverse: true})
  }

  const loadMore = async () => {
    limit += 10
  }

  let confirmIsOpen = false

  const getContent = e => (e.kind === 4 ? ensureMessagePlaintext(e) : e.content) || ""

  const openConfirm = () => {
    confirmIsOpen = true
  }

  const closeConfirm = () => {
    confirmIsOpen = false
  }

  let textarea, element, scroller, sending
  let limit = 10
  let showNewMessages = false
  let groupedMessages = []

  const isGroupMessage = pubkeys.length > 2
  const recipients = remove($session?.pubkey, pubkeys)
  const pubkeysWithoutInbox = derived(inboxRelaySelectionsByPubkey, $inboxRelayPoliciesByPubkey =>
    pubkeys.filter(pubkey => !$inboxRelayPoliciesByPubkey.has(pubkey)),
  )

  let useNip17 = isGroupMessage || ($hasNip44 && $pubkeysWithoutInbox.length === 0)

  onMount(() => {
    startScroller()

    if (textarea) {
      textarea.value = initialMessage
    }

    return () => {
      scroller?.stop()
    }
  })

  export const setMessage = message => {
    textarea.value = message
  }

  const scrollToBottom = () => element.scrollIntoView({behavior: "smooth", block: "end"})

  const stickToBottom = async () => {
    const lastMessage = pluck("created_at", groupedMessages).reduce(max, 0)
    const shouldStick = element?.scrollTop > -200

    if (shouldStick) {
      scrollToBottom()
    } else if (lastMessage < pluck("created_at", groupedMessages).reduce(max, 0)) {
      showNewMessages = true
    }
  }

  const addImage = imeta => {
    textarea.value += "\n" + imeta.get("url").value()
  }

  const sendAnyway = () => {
    send()
    closeConfirm()
  }

  const sendOrConfirm = () => {
    if (isGroupMessage && $pubkeysWithoutInbox.length > 0) {
      openConfirm()
    } else {
      send()
    }
  }

  const send = async () => {
    const content = textarea.value.trim()

    if (content) {
      textarea.value = ""
      sending = true

      await sendMessage(content, useNip17)

      sending = false
      stickToBottom()
    }
  }

  const onKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendOrConfirm()
    }
  }

  $: userHasInbox = !$pubkeysWithoutInbox.includes($session?.pubkey)
  $: hasSingleRecipientWithInbox = !isGroupMessage && !$pubkeysWithoutInbox.includes(recipients[0])

  // Group messages so we're only showing the person once per chunk
  $: {
    if (groupedMessages?.length === messages.length) {
      scroller?.stop()
    }

    const result = reverse(
      sortBy(prop("created_at"), messages).reduce((mx, m) => {
        return mx.concat({...m, showProfile: m.pubkey !== last(mx)?.pubkey})
      }, []),
    )

    setTimeout(stickToBottom, 100)

    groupedMessages = result.slice(0, limit) as (TrustedEvent & {showProfile: boolean})[]
  }
</script>

<svelte:window
  on:scroll={() => {
    showNewMessages = false
  }} />

<div class="fixed inset-0 z-chat flex flex-col bg-neutral-800 lg:ml-72">
  <div class="bg-neutral-900">
    <slot name="header" />
  </div>
  <div
    bind:this={element}
    class="flex flex-grow flex-col-reverse justify-start overflow-auto p-4 pb-6">
    <div>
      {#if sending && $signer instanceof Nip46Signer}
        <div
          class="m-auto flex items-center justify-center gap-2 pt-6 text-neutral-500"
          transition:slide>
          <i class="fa fa-circle-notch fa-spin" />
          <span>Sending your message...</span>
        </div>
      {/if}
    </div>
    {#each groupedMessages as message (message.id)}
      <div in:fly={{y: 20}} class="grid gap-2 py-1">
        <div
          class={cx("max-w-xl rounded-2xl px-4 py-2 flex flex-col gap-2", {
            "ml-12 justify-self-end rounded-br-none bg-neutral-100 text-neutral-800":
              message.pubkey === $session.pubkey,
            "mr-12 rounded-bl-none bg-tinted-800": message.pubkey !== $session.pubkey,
          })}>
          {#if message.showProfile && message.pubkey !== $session.pubkey}
            <PersonBadgeMedium pubkey={message.pubkey} />
          {/if}
          <div class="break-words">
            {#await getContent(message)}
              <!-- pass -->
            {:then content}
              <NoteContent showEntire note={{...message, content}} />
            {/await}
          </div>
          <small
            class="mt-1 flex items-center justify-between gap-2 text-xs"
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
                    This message was sent using nostr's new group chat specification, which solves
                    several problems with legacy DMs. Read more <Anchor
                      underline
                      modal
                      href="/help/nip-44-dms">here</Anchor
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
      </div>
    {/each}
    {#await loading}
      <Spinner>Looking for messages...</Spinner>
    {:then}
      <div in:fly={{y: 20}} class="py-20 text-center">End of message history</div>
    {/await}
  </div>
  {#if $hasNip44 || !isGroupMessage}
    <div
      class="flex border-t border-solid border-neutral-600 border-tinted-700 bg-neutral-900 dark:bg-neutral-600">
      <textarea
        rows="3"
        autofocus
        placeholder="Type something..."
        bind:this={textarea}
        on:keydown={onKeyDown}
        class="mb-8 w-full resize-none bg-transparent p-2
             text-neutral-100 outline-0 placeholder:text-neutral-100" />
      <div>
        <ImageInput multi on:change={e => addImage(e.detail)}>
          <button
            slot="button"
            class="flex cursor-pointer flex-col justify-center gap-2 border-l border-solid border-tinted-700 p-3
                 py-6 text-neutral-100 transition-all hover:bg-accent hover:text-white">
            <i class="fa-solid fa-paperclip fa-lg" />
          </button>
        </ImageInput>
        <button
          on:click={sendOrConfirm}
          class="flex cursor-pointer flex-col justify-center gap-2 border-l border-solid border-tinted-700 p-3
               py-6 text-neutral-100 transition-all hover:bg-accent hover:text-white">
          <i class="fa-solid fa-paper-plane fa-lg" />
        </button>
      </div>
      {#if $hasNip44 && hasSingleRecipientWithInbox}
        <div class="fixed bottom-0 right-12 flex items-center justify-end gap-2 p-2">
          {#if userHasInbox}
            <Toggle scale={toggleScale} bind:value={useNip17} />
          {:else}
            <Popover triggerType="mouseenter">
              <div slot="trigger">
                <Toggle disabled scale={toggleScale} value={false} />
              </div>
              <Anchor modal slot="tooltip" class="flex items-center gap-1" href="/settings/relays">
                <i class="fa fa-info-circle" />
                You must have at least one inbox relay to send messages using nip-17. Click here to set
                up your inbox relays.
              </Anchor>
            </Popover>
          {/if}
          <small>
            Send messages using
            <Popover class="inline">
              <span slot="trigger" class="cursor-pointer underline">NIP 17</span>
              <div slot="tooltip" class="flex flex-col gap-2">
                <p>
                  When enabled, Coracle will use nostr's new group chat specification, which solves
                  several problems with legacy DMs. Read more <Anchor
                    underline
                    modal
                    href="/help/nip-17-dms">here</Anchor
                  >.
                </p>
                <p>
                  Note that these messages are not yet universally supported. Make sure the person
                  you're chatting with is using a compatible nostr client.
                </p>
              </div>
            </Popover>
          </small>
        </div>
      {/if}
    </div>
  {:else}
    <FlexColumn class="bg-neutral-900 px-4 py-2">
      <p class="flex items-center gap-2">
        <i class="fa fa-info-circle p-1" />
        You are using a login method that doesn't yet support group chats. Please consider upgrading
        your signer to access this feature.
      </p>
    </FlexColumn>
  {/if}
  {#if showNewMessages}
    <div
      class="fixed bottom-32 flex w-full cursor-pointer justify-center"
      transition:fly|local={{y: 20}}
      on:click={scrollToBottom}>
      <div class="rounded-full bg-accent px-4 py-2 text-neutral-100">New messages found</div>
    </div>
  {/if}
</div>

{#if confirmIsOpen}
  <Modal onEscape={closeConfirm}>
    <Subheading>Missing Inbox Relays</Subheading>
    {#if $pubkeysWithoutInbox.length > 0}
      <p>
        {displayList($pubkeysWithoutInbox.map(displayProfileByPubkey))}
        {pluralize($pubkeysWithoutInbox.length, "does not have", "do not have")}
        inbox relays, which means they likely either don't want to receive DMs, or are using a client
        that does not support nostr group chats.
      </p>
    {:else if !userHasInbox}
      <p>
        You don't have any inbox relays set up yet, which will make it difficult for you to receive
        replies to this conversation. Click <Anchor underline href="/settings/relays">here</Anchor> to
        set up your inbox relays.
      </p>
    {/if}
    <div class="flex justify-between">
      <Anchor button on:click={closeConfirm}>Cancel</Anchor>
      <Anchor button accent on:click={sendAnyway}>Send anyway</Anchor>
    </div>
  </Modal>
{/if}
