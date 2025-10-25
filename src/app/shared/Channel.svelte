<script lang="ts">
  import {sleep, displayList, prop, sortBy, max, last, pluck} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {isShareableRelayUrl, getRelaysFromList, getPubkeyTagValues} from "@welshman/util"
  import {
    session,
    displayProfileByPubkey,
    inboxRelaySelectionsByPubkey,
    repository,
  } from "@welshman/app"
  import {onMount} from "svelte"
  import {derived} from "svelte/store"
  import {fly} from "src/util/transition"
  import {createScroller, pluralize} from "src/util/misc"
  import {showWarning} from "src/partials/Toast.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Link from "src/partials/Link.svelte"
  import Button from "src/partials/Button.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import {
    hasNip44,
    sendMessage,
    userSettings,
    unwrapErrors,
    ensureUnwrapped,
    getChannelId,
  } from "src/engine"
  import {makeEditor} from "src/app/editor"
  import Message from "src/app/shared/Message.svelte"
  import EditorContent from "src/app/editor/EditorContent.svelte"

  export let pubkeys
  export let channelId: string
  export let messages: TrustedEvent[]

  const loading = sleep(5_000)

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

  const pubkeysWithoutInbox = derived(inboxRelaySelectionsByPubkey, $inboxRelaySelectionsByPubkey =>
    pubkeys.filter(
      pubkey =>
        !getRelaysFromList($inboxRelaySelectionsByPubkey.get(pubkey)).some(isShareableRelayUrl),
    ),
  )

  // Filter unwrap errors to only show failures for this specific conversation
  const failedWraps = derived(unwrapErrors, $errors => {
    return Object.values($errors)
      .filter(errorData => {
        // Match errors to this channel by comparing pubkeys in conversation
        const errorChannelId = getChannelId([errorData.pubkey, ...getPubkeyTagValues(errorData.tags)])
        return errorChannelId === channelId
      })
      .map(errorData => ({
        id: errorData.id,
        pubkey: errorData.pubkey,
        tags: errorData.tags,
        created_at: errorData.created_at,
        error: {message: errorData.message},
      }))
  })

  const contactMaintainerUrl =
    "https://github.com/coracle-social/coracle/issues/new?labels=support&title=Coracle%20DM%20support"

  const scrollToBottom = () => element.scrollIntoView({behavior: "smooth", block: "end"})

  const stickToBottom = async () => {
    const lastMessage = max(pluck<number>("created_at", groupedMessages))
    const shouldStick = element?.scrollTop > -200

    if (shouldStick) {
      scrollToBottom()
    } else if (lastMessage < max(pluck<number>("created_at", groupedMessages))) {
      showNewMessages = true
    }
  }

  const sendAnyway = () => {
    send()
    closeConfirm()
  }

  const sendOrConfirm = () => {
    if ($pubkeysWithoutInbox.length > 0) {
      openConfirm()
    } else {
      send()
    }
  }

  const send = async () => {
    const content = editor.getText({blockSeparator: "\n"}).trim()

    editor.commands.clearContent()

    if (content) {
      sending = true

      try {
        await sendMessage(channelId, content, $userSettings.send_delay)
      } catch (e: any) {
        showWarning(`Failed to send message: ${e.error || "unknown error"}`)
      }

      sending = false
      stickToBottom()
    }
  }

  const editor = makeEditor({
    autofocus: true,
    aggressive: true,
    placeholder: "Say hello...",
    submit: sendOrConfirm,
  })

  let element, scroller, sending
  let limit = 10
  let showNewMessages = false
  let groupedMessages = []
  let failedWrapList = []
  let retrying: Record<string, boolean> = {}

  $: userHasInbox = !$pubkeysWithoutInbox.includes($session?.pubkey)

  // Merge regular messages with failed wrap error placeholders
  $: failedWrapList = $failedWraps
  $: combinedMessages = [...messages, ...failedWrapList]

  // Sort by timestamp and add profile display hints for message grouping
  $: sortedMessages = sortBy(prop("created_at"), combinedMessages).reduce((mx, m) => {
    const previous = last(mx)
    const isError = "error" in m
    // Hide profile for error messages, show for regular messages when sender changes
    const showProfile = isError ? false : m.pubkey !== previous?.pubkey

    return mx.concat({...m, showProfile})
  }, [])

  // Display messages in reverse chronological order, limited by scroll position
  $: {
    const result = sortedMessages.reverse()
    groupedMessages = result.slice(0, limit) as (TrustedEvent & {showProfile: boolean})[]

    // Stop auto-scrolling if message count is stable
    if (groupedMessages?.length === combinedMessages.length) {
      scroller?.stop()
    }

    setTimeout(stickToBottom, 100)
  }

  // Retry decrypting a failed message
  const retryWrap = async (errorData: {id: string; error?: {message: string}}) => {
    retrying = {...retrying, [errorData.id]: true}

    try {
      // Retrieve full WRAP event from repository (error store only has minimal data)
      const fullEvent = repository.getEvent(errorData.id)
      if (fullEvent) {
        // Attempt to unwrap again - if successful, error will be cleared automatically
        await ensureUnwrapped(fullEvent)
      }
    } finally {
      // Always reset retry state, even if decryption fails again
      retrying = {...retrying, [errorData.id]: false}
    }
  }

  const isRetrying = (id: string) => Boolean(retrying[id])

  onMount(() => {
    startScroller()

    return () => {
      scroller?.stop()
      editor.destroy()
    }
  })
</script>

<svelte:window
  on:scroll={() => {
    showNewMessages = false
  }} />

<div class="inset-sai fixed z-chat flex flex-col bg-neutral-800 lg:ml-72">
  <div class="bg-neutral-900">
    <slot name="header" />
  </div>
  <div
    bind:this={element}
    class="flex flex-grow flex-col-reverse justify-start overflow-auto p-4 pb-6">
    {#if !userHasInbox}
      <div class="m-auto max-w-96 py-20 text-center">
        <div class="mb-4 text-lg text-accent">
          <i class="fa fa-exclamation-triangle"></i> Your inbox is not configured.
        </div>
        In order to deliver messages, Coracle needs to know where to send them. Please visit your
        <a class="cursor-pointer underline" href="/settings/relays"> relay settings page</a> and set
        up your inbox relays.
      </div>
    {/if}
    {#each groupedMessages as message (message.id)}
      {#if message.error}
        <!-- Error UI: Show when message decryption fails (e.g., locked signer, wrong key) -->
        <div class="grid gap-2 py-1">
          <div class="mr-12 max-w-xl rounded-2xl rounded-bl-none bg-neutral-900 px-4 py-3 text-neutral-100">
            <p class="font-semibold">We couldn't open this message.</p>
            <p class="mt-1 text-sm text-neutral-200">
              Make sure your secure chat app is unlocked, then try again.
            </p>
            <div class="mt-3 flex flex-wrap gap-3 text-sm">
              <button
                class="underline"
                class:opacity-50={isRetrying(message.id)}
                class:pointer-events-none={isRetrying(message.id)}
                on:click={() => retryWrap(message)}>
                {#if isRetrying(message.id)}
                  Trying...
                {:else}
                  Try again
                {/if}
              </button>
              <span aria-hidden="true">•</span>
              <Link external class="underline" href={contactMaintainerUrl}>
                Contact hodlbod for help
              </Link>
            </div>
          </div>
        </div>
      {:else}
        <!-- Normal message display -->
        <Message {message} />
      {/if}
    {/each}
    {#await loading}
      <Spinner>Looking for messages...</Spinner>
    {:then}
      <div in:fly={{y: 20}} class="py-20 text-center">End of message history</div>
    {/await}
  </div>
  {#if $hasNip44}
    <div class="flex border-t border-solid border-tinted-700 bg-neutral-900 dark:bg-neutral-600">
      <EditorContent
        {editor}
        class="w-full resize-none border-r border-solid border-tinted-700 bg-transparent p-2 text-neutral-100 outline-0 placeholder:text-neutral-100" />
      <div>
        <button
          class="flex cursor-pointer flex-col justify-center gap-2 p-3
                 py-6 text-neutral-100 transition-all hover:bg-accent hover:text-white"
          on:click={() => editor.chain().selectFiles().run()}>
          <i class="fa-solid fa-paperclip fa-lg" />
        </button>
        <button
          on:click={sendOrConfirm}
          class="flex cursor-pointer flex-col justify-center gap-2 p-3
               py-6 text-neutral-100 transition-all hover:bg-accent hover:text-white">
          {#if sending}
            <i class="fa fa-circle-notch fa-spin fa-lg" />
          {:else}
            <i class="fa-solid fa-paper-plane fa-lg" />
          {/if}
        </button>
      </div>
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
        inbox relays, which means they may not be able to receive DMs.
      </p>
    {:else if !userHasInbox}
      <p>
        You don't have any inbox relays set up yet, which will make it difficult for you to receive
        replies to this conversation. Click <Link class="underline" href="/settings/relays"
          >here</Link> to set up your inbox relays.
      </p>
    {/if}
    <div class="flex justify-between">
      <Button class="btn" on:click={closeConfirm}>Cancel</Button>
      <Button class="btn btn-accent" on:click={sendAnyway}>Send anyway</Button>
    </div>
  </Modal>
{/if}
