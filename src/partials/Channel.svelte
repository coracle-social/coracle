<script lang="ts">
  import {onMount} from "svelte"
  import {displayList, pluralize} from "hurdak"
  import {sleep, remove} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {Nip46Signer} from "@welshman/signer"
  import {session, signer, displayProfileByPubkey} from "@welshman/app"
  import {prop, max, reverse, pluck, sortBy, last} from "ramda"
  import {fly, slide} from "src/util/transition"
  import {createScroller} from "src/util/misc"
  import Spinner from "src/partials/Spinner.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import {hasNip44, derivePubkeysWithoutInbox} from "src/engine"
  import Modal from "src/partials/Modal.svelte"
  import Subheading from "src/partials/Subheading.svelte"

  export let pubkeys
  export let sendMessage
  export let initialMessage = ""
  export let messages: TrustedEvent[]

  const loading = sleep(30_000)
  const toggleScale = 0.7

  const startScroller = () => {
    scroller?.stop()
    scroller = createScroller(loadMore, {element, reverse: true})
  }

  const loadMore = async () => {
    limit += 10
  }

  let confirmIsOpen = false

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
  const pubkeysWithoutInbox = derivePubkeysWithoutInbox(pubkeys)
  const recipients = remove($session?.pubkey, pubkeys)

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
    {#each groupedMessages as m (m.id)}
      <div in:fly={{y: 20}} class="grid gap-2 py-1">
        <slot name="message" message={m} />
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
