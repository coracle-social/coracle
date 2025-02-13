<script lang="ts">
  import {readable} from "svelte/store"
  import {onMount, onDestroy} from "svelte"
  import {page} from "$app/stores"
  import type {Readable} from "svelte/store"
  import {now} from "@welshman/lib"
  import type {TrustedEvent, EventContent} from "@welshman/util"
  import {createEvent, MESSAGE, DELETE, REACTION} from "@welshman/util"
  import {formatTimestampAsDate, pubkey, publishThunk, deriveRelay} from "@welshman/app"
  import {slide, fade, fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import MenuSpaceButton from "@app/components/MenuSpaceButton.svelte"
  import ChannelName from "@app/components/ChannelName.svelte"
  import ChannelMessage from "@app/components/ChannelMessage.svelte"
  import ChannelCompose from "@app/components/ChannelCompose.svelte"
  import ChannelComposeParent from "@app/components/ChannelComposeParent.svelte"
  import {
    userSettingValues,
    decodeRelay,
    GENERAL,
    tagRoom,
    userRoomsByUrl,
    displayChannel,
    getEventsForUrl,
  } from "@app/state"
  import {setChecked, checked} from "@app/notifications"
  import {
    nip29,
    addRoomMembership,
    removeRoomMembership,
    prependParent,
    getThunkError,
  } from "@app/commands"
  import {PROTECTED, hasNip29} from "@app/state"
  import {makeFeed} from "@app/requests"
  import {popKey} from "@app/implicit"
  import {pushToast} from "@app/toast"

  const {room = GENERAL} = $page.params
  const lastChecked = $checked[$page.url.pathname]
  const url = decodeRelay($page.params.relay)
  const filter = {kinds: [MESSAGE], "#h": [room]}
  const relay = deriveRelay(url)

  const assertEvent = (e: any) => e as TrustedEvent

  const joinRoom = async () => {
    if (hasNip29($relay)) {
      joiningRoom = true

      const message = await getThunkError(nip29.joinRoom(url, room))

      joiningRoom = false

      if (message && !message.includes("already")) {
        return pushToast({theme: "error", message})
      }
    }

    addRoomMembership(url, room, displayChannel(url, room))
  }

  const leaveRoom = () => {
    if (hasNip29($relay)) {
      nip29.leaveRoom(url, room)
    }

    removeRoomMembership(url, room)
  }

  const replyTo = (event: TrustedEvent) => {
    parent = event
    compose?.focus()
  }

  const clearParent = () => {
    parent = undefined
  }

  const clearShare = () => {
    share = undefined
  }

  const onSubmit = ({content, tags}: EventContent) => {
    tags.push(tagRoom(room, url))
    tags.push(PROTECTED)

    let template = {content, tags}

    if (share) {
      template = prependParent(share, template)
    }

    if (parent) {
      template = prependParent(parent, template)
    }

    publishThunk({
      relays: [url],
      event: createEvent(MESSAGE, template),
      delay: $userSettingValues.send_delay,
    })

    clearParent()
    clearShare()
  }

  const onScroll = () => {
    showScrollButton = Math.abs(element?.scrollTop || 0) > 1500

    if (!newMessages || newMessagesSeen) {
      showFixedNewMessages = false
    } else {
      const {y} = newMessages.getBoundingClientRect()

      if (y > 300) {
        newMessagesSeen = true
      } else {
        showFixedNewMessages = y < 0
      }
    }
  }

  const scrollToNewMessages = () =>
    newMessages?.scrollIntoView({behavior: "smooth", block: "center"})

  const scrollToBottom = () => element?.scrollTo({top: 0, behavior: "smooth"})

  let joiningRoom = $state(false)
  let loadingEvents = $state(true)
  let share = $state(popKey<TrustedEvent | undefined>("share"))
  let parent: TrustedEvent | undefined = $state()
  let element: HTMLElement | undefined = $state()
  let newMessages: HTMLElement | undefined = $state()
  let newMessagesSeen = false
  let showFixedNewMessages = $state(false)
  let showScrollButton = $state(false)
  let cleanup: () => void
  let events: Readable<TrustedEvent[]> = $state(readable([]))
  let compose: ChannelCompose | undefined = $state()

  const elements = $derived.by(() => {
    const elements = []
    const seen = new Set()

    let previousDate
    let previousPubkey
    let newMessagesSeen = false

    if (events) {
      const lastUserEvent = $events.find(e => e.pubkey === $pubkey)

      // Adjust last checked to account for messages that came from a different device
      const adjustedLastChecked =
        lastChecked && lastUserEvent ? Math.max(lastUserEvent.created_at, lastChecked) : lastChecked

      for (const event of $events.toReversed()) {
        if (seen.has(event.id)) {
          continue
        }

        const date = formatTimestampAsDate(event.created_at)

        if (
          !newMessagesSeen &&
          adjustedLastChecked &&
          event.pubkey !== $pubkey &&
          event.created_at > adjustedLastChecked
        ) {
          elements.push({type: "new-messages", id: "new-messages"})
          newMessagesSeen = true
        }

        if (date !== previousDate) {
          elements.push({type: "date", value: date, id: date, showPubkey: false})
        }

        elements.push({
          id: event.id,
          type: "note",
          value: event,
          showPubkey: date !== previousDate || previousPubkey !== event.pubkey,
        })

        previousDate = date
        previousPubkey = event.pubkey
        seen.add(event.id)
      }
    }

    elements.reverse()

    setTimeout(onScroll, 100)

    return elements
  })

  onMount(() => {
    ;({events, cleanup} = makeFeed({
      element: element!,
      relays: [url],
      feedFilters: [filter],
      subscriptionFilters: [{kinds: [DELETE, REACTION, MESSAGE], "#h": [room], since: now()}],
      initialEvents: getEventsForUrl(url, [{...filter, limit: 20}]),
      onExhausted: () => {
        loadingEvents = false
      },
    }))
  })

  onDestroy(() => {
    cleanup()

    // Sveltekit calls onDestroy at the beginning of the page load for some reason
    setTimeout(() => {
      setChecked($page.url.pathname)
    }, 300)
  })
</script>

<div class="relative flex h-full flex-col">
  <PageBar>
    {#snippet icon()}
      <div class="center">
        <Icon icon="hashtag" />
      </div>
    {/snippet}
    {#snippet title()}
      <strong>
        <ChannelName {url} {room} />
      </strong>
    {/snippet}
    {#snippet action()}
      <div class="row-2">
        {#if room !== GENERAL}
          {#if $userRoomsByUrl.get(url)?.has(room)}
            <Button class="btn btn-neutral btn-sm" onclick={leaveRoom}>
              <Icon icon="arrows-a-logout-2" />
              Leave Room
            </Button>
          {:else}
            <Button class="btn btn-neutral btn-sm" disabled={joiningRoom} onclick={joinRoom}>
              {#if joiningRoom}
                <span class="loading loading-spinner loading-sm"></span>
              {:else}
                <Icon icon="login-2" />
              {/if}
              Join Room
            </Button>
          {/if}
        {/if}
        <MenuSpaceButton {url} />
      </div>
    {/snippet}
  </PageBar>
  <div
    class="scroll-container -mt-2 flex flex-grow flex-col-reverse overflow-y-auto overflow-x-hidden py-2"
    onscroll={onScroll}
    bind:this={element}>
    {#each elements as { type, id, value, showPubkey } (id)}
      {#if type === "new-messages"}
        <div
          bind:this={newMessages}
          class="flex items-center py-2 text-xs transition-colors"
          class:opacity-0={showFixedNewMessages}>
          <div class="h-px flex-grow bg-primary"></div>
          <p class="rounded-full bg-primary px-2 py-1 text-primary-content">New Messages</p>
          <div class="h-px flex-grow bg-primary"></div>
        </div>
      {:else if type === "date"}
        <Divider>{value}</Divider>
      {:else}
        <div in:slide class:-mt-1={!showPubkey}>
          <ChannelMessage {url} {room} {replyTo} event={assertEvent(value)} {showPubkey} />
        </div>
      {/if}
    {/each}
    <p class="flex h-10 items-center justify-center py-20">
      {#if loadingEvents}
        <Spinner loading={loadingEvents}>Looking for messages...</Spinner>
      {:else}
        <Spinner>End of message history</Spinner>
      {/if}
    </p>
  </div>
  {#if showFixedNewMessages}
    <div class="relative z-feature flex justify-center">
      <div transition:fly={{duration: 200}} class="fixed top-12">
        <Button class="btn btn-primary btn-xs rounded-full" onclick={scrollToNewMessages}>
          New Messages
        </Button>
      </div>
    </div>
  {/if}
  <div>
    {#if parent}
      <ChannelComposeParent event={parent} clear={clearParent} verb="Replying to" />
    {/if}
    {#if share}
      <ChannelComposeParent event={share} clear={clearShare} verb="Sharing" />
    {/if}
    <ChannelCompose bind:this={compose} {onSubmit} />
  </div>
</div>

{#if showScrollButton}
  <div in:fade class="fixed bottom-14 right-4">
    <Button class="btn btn-circle btn-neutral" onclick={scrollToBottom}>
      <Icon icon="alt-arrow-down" />
    </Button>
  </div>
{/if}
