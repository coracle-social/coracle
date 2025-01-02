<script lang="ts">
  import {nip19} from "nostr-tools"
  import {onMount} from "svelte"
  import {derived} from "svelte/store"
  import {page} from "$app/stores"
  import {sleep, now, ctx} from "@welshman/lib"
  import type {TrustedEvent, EventContent} from "@welshman/util"
  import {throttled} from "@welshman/store"
  import {feedsFromFilter, makeIntersectionFeed, makeRelayFeed} from "@welshman/feeds"
  import {createEvent, MESSAGE, DELETE, REACTION} from "@welshman/util"
  import {
    formatTimestampAsDate,
    createFeedController,
    subscribe,
    publishThunk,
    deriveRelay,
  } from "@welshman/app"
  import {slide} from "@lib/transition"
  import {createScroller, type Scroller} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import type {getEditor} from "@app/editor"
  import MenuSpaceButton from "@app/components/MenuSpaceButton.svelte"
  import ChannelName from "@app/components/ChannelName.svelte"
  import ChannelMessage from "@app/components/ChannelMessage.svelte"
  import ChannelCompose from "@app/components/ChannelCompose.svelte"
  import {
    userSettingValues,
    decodeRelay,
    deriveEventsForUrl,
    GENERAL,
    tagRoom,
    LEGACY_MESSAGE,
    userRoomsByUrl,
    displayChannel,
  } from "@app/state"
  import {setChecked} from "@app/notifications"
  import {nip29, addRoomMembership, removeRoomMembership, getThunkError} from "@app/commands"
  import {PROTECTED, hasNip29} from "@app/state"
  import {popKey} from "@app/implicit"
  import {pushToast} from "@app/toast"

  const {room = GENERAL} = $page.params
  const content = popKey<string>("content") || ""
  const url = decodeRelay($page.params.relay)
  const relay = deriveRelay(url)
  const legacyRoom = room === GENERAL ? "general" : room
  const feeds = feedsFromFilter({kinds: [MESSAGE], "#h": [room]})

  const events = throttled(
    300,
    deriveEventsForUrl(url, [
      {kinds: [MESSAGE], "#h": [room]},
      {kinds: [LEGACY_MESSAGE], "#~": [legacyRoom]},
    ]),
  )

  const ctrl = createFeedController({
    useWindowing: true,
    feed: makeIntersectionFeed(makeRelayFeed(url), ...feeds),
    onExhausted: () => {
      loading = false
    },
  })

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
    const relays = ctx.app.router.Event(event).getUrls()
    const nevent = nip19.neventEncode({...event, relays})

    $editor.commands.insertNEvent({nevent})
    $editor.commands.insertContent("\n")
    $editor.commands.focus()
  }

  const onSubmit = ({content, tags}: EventContent) =>
    publishThunk({
      relays: [url],
      event: createEvent(MESSAGE, {content, tags: [...tags, tagRoom(room, url), PROTECTED]}),
      delay: $userSettingValues.send_delay,
    })

  let limit = 100
  let loading = true
  let unmounted = false
  let element: HTMLElement
  let scroller: Scroller
  let editor: ReturnType<typeof getEditor>

  const elements = derived(events, $events => {
    const $elements = []

    let previousDate
    let previousPubkey

    for (const event of $events.toReversed()) {
      const {id, pubkey, created_at} = event
      const date = formatTimestampAsDate(created_at)

      if (date !== previousDate) {
        $elements.push({type: "date", value: date, id: date, showPubkey: false})
      }

      $elements.push({
        id,
        type: "note",
        value: event,
        showPubkey: date !== previousDate || previousPubkey !== pubkey,
      })

      previousDate = date
      previousPubkey = pubkey
    }

    return $elements.reverse()
  })

  onMount(() => {
    // Element is frequently not defined. I don't know why
    sleep(1000).then(() => {
      if (!unmounted) {
        scroller = createScroller({
          element,
          delay: 300,
          threshold: 10_000,
          onScroll: () => {
            limit += 100

            if ($events.length - limit < 100) {
              ctrl.load(200)
            }
          },
        })
      }
    })

    const sub = subscribe({
      relays: [url],
      filters: [{kinds: [DELETE, REACTION, MESSAGE], "#h": [room], since: now()}],
    })

    return () => {
      unmounted = true
      setChecked($page.url.pathname)
      scroller?.stop()
      sub.close()
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
    class="scroll-container -mt-2 flex flex-grow flex-col-reverse overflow-auto py-2"
    bind:this={element}>
    {#each $elements.slice(0, limit) as { type, id, value, showPubkey } (id)}
      {#if type === "date"}
        <Divider>{value}</Divider>
      {:else}
        <div in:slide class:-mt-4={!showPubkey}>
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
  <ChannelCompose bind:editor {content} {onSubmit} />
</div>
