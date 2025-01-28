<script lang="ts">
  import * as nip19 from "nostr-tools/nip19"
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import type {Readable} from "svelte/store"
  import {now, ctx} from "@welshman/lib"
  import type {TrustedEvent, EventContent} from "@welshman/util"
  import {createEvent, toNostrURI, MESSAGE, DELETE, REACTION} from "@welshman/util"
  import {
    displayProfileByPubkey,
    formatTimestampAsDate,
    tagEventForQuote,
    publishThunk,
    deriveRelay,
    repository,
  } from "@welshman/app"
  import {slide, fade} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import type {getEditor} from "@app/editor"
  import MenuSpaceButton from "@app/components/MenuSpaceButton.svelte"
  import Content from "@app/components/Content.svelte"
  import ChannelName from "@app/components/ChannelName.svelte"
  import ChannelMessage from "@app/components/ChannelMessage.svelte"
  import ChannelCompose from "@app/components/ChannelCompose.svelte"
  import {
    userSettingValues,
    decodeRelay,
    GENERAL,
    tagRoom,
    userRoomsByUrl,
    displayChannel,
    getEventsForUrl,
  } from "@app/state"
  import {setChecked} from "@app/notifications"
  import {nip29, addRoomMembership, removeRoomMembership, getThunkError} from "@app/commands"
  import {PROTECTED, hasNip29} from "@app/state"
  import {makeFeed} from "@app/requests"
  import {popKey} from "@app/implicit"
  import {pushToast} from "@app/toast"

  const {room = GENERAL} = $page.params
  const content = popKey<string>("content") || ""
  const url = decodeRelay($page.params.relay)
  const filter = {kinds: [MESSAGE], "#h": [room]}
  const relay = deriveRelay(url)

  const assertEvent = (e: any) => e as TrustedEvent

  const joinRoom = async () => {
    if (hasNip29($relay)) {
      const message = await getThunkError(nip29.joinRoom(url, room))

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
  }

  const clearParent = () => {
    parent = undefined
  }

  const onSubmit = ({content, tags}: EventContent) => {
    tags.push(tagRoom(room, url))
    tags.push(PROTECTED)

    if (parent) {
      const nevent = nip19.neventEncode({
        id: parent.id,
        kind: parent.kind,
        author: parent.pubkey,
        relays: ctx.app.router.Event(parent).limit(3).getUrls(),
      })

      tags.push(tagEventForQuote(parent))
      content = toNostrURI(nevent) + "\n\n" + content
    }

    publishThunk({
      relays: [url],
      event: createEvent(MESSAGE, {content, tags}),
      delay: $userSettingValues.send_delay,
    })
  }

  const scrollToBottom = () => element.scrollTo({top: 0, behavior: "smooth"})

  let parent: TrustedEvent | undefined
  let loading = true
  let element: HTMLElement
  let showScrollButton = false
  let editor: ReturnType<typeof getEditor>
  let cleanup: () => void
  let events: Readable<TrustedEvent[]>
  let elements: any[] = []

  $: {
    elements = []

    const seen = new Set()

    let previousDate
    let previousPubkey

    if (events) {
      for (const event of $events.toReversed()) {
        const {id, pubkey, created_at} = event

        if (seen.has(id)) {
          continue
        }

        const date = formatTimestampAsDate(created_at)

        if (date !== previousDate) {
          elements.push({type: "date", value: date, id: date, showPubkey: false})
        }

        elements.push({
          id,
          type: "note",
          value: event,
          showPubkey: date !== previousDate || previousPubkey !== pubkey,
        })

        previousDate = date
        previousPubkey = pubkey
        seen.add(id)
      }
    }

    elements.reverse()
  }

  $: {
    if (element) {
      element.addEventListener("scroll", () => {
        showScrollButton = Math.abs(element.scrollTop) > 1500
      })
      ;({events, cleanup} = makeFeed({
        element,
        relays: [url],
        feedFilters: [filter],
        subscriptionFilters: [{kinds: [DELETE, REACTION, MESSAGE], "#h": [room], since: now()}],
        initialEvents: getEventsForUrl(repository, url, [{...filter, limit: 20}]),
        onExhausted: () => {
          loading = false
        },
      }))
    }
  }

  onMount(() => {
    return () => {
      setChecked($page.url.pathname)
      cleanup()
    }
  })
</script>

<div class="relative flex h-full flex-col">
  <PageBar>
    <div slot="icon" class="center">
      <Icon icon="hashtag" />
    </div>
    <strong slot="title">
      <ChannelName {url} {room} />
    </strong>
    <div slot="action" class="row-2">
      {#if room !== GENERAL}
        {#if $userRoomsByUrl.get(url)?.has(room)}
          <Button class="btn btn-neutral btn-sm" on:click={leaveRoom}>
            <Icon icon="arrows-a-logout-2" />
            Leave Room
          </Button>
        {:else}
          <Button class="btn btn-neutral btn-sm" on:click={joinRoom}>
            <Icon icon="login-2" />
            Join Room
          </Button>
        {/if}
      {/if}
      <MenuSpaceButton {url} />
    </div>
  </PageBar>
  <div
    class="scroll-container -mt-2 flex flex-grow flex-col-reverse overflow-y-auto overflow-x-hidden py-2"
    bind:this={element}>
    {#each elements as { type, id, value, showPubkey } (id)}
      {#if type === "date"}
        <Divider>{value}</Divider>
      {:else}
        <div in:slide class:-mt-1={!showPubkey}>
          <ChannelMessage {url} {room} {replyTo} event={assertEvent(value)} {showPubkey} />
        </div>
      {/if}
    {/each}
    <p class="flex h-10 items-center justify-center py-20">
      {#if loading}
        <Spinner loading>Looking for messages...</Spinner>
      {:else}
        <Spinner>End of message history</Spinner>
      {/if}
    </p>
  </div>
  <div>
    {#if parent}
      <div
        class="relative border-l-2 border-solid border-primary bg-base-300 px-2 py-1 text-xs"
        transition:slide>
        <p class="text-primary">Replying to @{displayProfileByPubkey(parent.pubkey)}</p>
        <Content event={parent} minLength={30} maxLength={200} />
        <Button class="absolute right-2 top-2 cursor-pointer" on:click={clearParent}>
          <Icon icon="close-circle" />
        </Button>
      </div>
    {/if}
    <ChannelCompose bind:editor {content} {onSubmit} />
  </div>
</div>

{#if showScrollButton}
  <div in:fade class="fixed bottom-14 right-4">
    <Button class="btn btn-circle btn-neutral" on:click={scrollToBottom}>
      <Icon icon="alt-arrow-down" />
    </Button>
  </div>
{/if}
