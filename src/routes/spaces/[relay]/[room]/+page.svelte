<script lang="ts">
  import {nip19} from "nostr-tools"
  import {onMount, onDestroy} from "svelte"
  import type {Readable} from "svelte/store"
  import {derived} from "svelte/store"
  import type {Editor} from "svelte-tiptap"
  import {page} from "$app/stores"
  import {sleep, now, ctx} from "@welshman/lib"
  import type {TrustedEvent, EventContent} from "@welshman/util"
  import {throttled} from "@welshman/store"
  import {createEvent, DELETE} from "@welshman/util"
  import {formatTimestampAsDate, publishThunk} from "@welshman/app"
  import {slide} from "@lib/transition"
  import {createScroller, type Scroller} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import MenuSpaceButton from "@app/components/MenuSpaceButton.svelte"
  import ChannelMessage from "@app/components/ChannelMessage.svelte"
  import ChannelCompose from "@app/components/ChannelCompose.svelte"
  import {
    pullConservatively,
    userSettingValues,
    userMembership,
    decodeRelay,
    deriveChannelMessages,
    GENERAL,
    tagRoom,
    MESSAGE,
    getMembershipRoomsByUrl,
    displayRoom,
  } from "@app/state"
  import {setChecked} from "@app/notifications"
  import {addRoomMembership, removeRoomMembership, subscribePersistent} from "@app/commands"
  import {PROTECTED} from "@app/state"
  import {popKey} from "@app/implicit"

  const {room = GENERAL} = $page.params
  const content = popKey<string>("content") || ""
  const url = decodeRelay($page.params.relay)
  const events = throttled(300, deriveChannelMessages(url, room))

  const assertEvent = (e: any) => e as TrustedEvent

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

  let limit = 15
  let loading = true
  let unsub: () => void
  let element: HTMLElement
  let scroller: Scroller
  let editor: Readable<Editor>

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

    return $elements.reverse().slice(0, limit)
  })

  onMount(async () => {
    // Sveltekiiit
    await sleep(100)

    pullConservatively({
      relays: [url],
      filters: [{kinds: [MESSAGE, DELETE], "#h": [room]}],
    })

    scroller = createScroller({
      element,
      delay: 300,
      threshold: 3000,
      onScroll: () => {
        limit += 15
      },
    })

    unsub = subscribePersistent({
      relays: [url],
      filters: [{kinds: [MESSAGE], "#h": [room], since: now()}],
    })
  })

  onDestroy(() => {
    setChecked($page.url.pathname)
    scroller?.stop()
    unsub?.()
  })

  setTimeout(() => {
    loading = false
  }, 5000)
</script>

<div class="relative flex h-full flex-col">
  <PageBar>
    <div slot="icon" class="center">
      <Icon icon="hashtag" />
    </div>
    <strong slot="title">{displayRoom(room)}</strong>
    <div slot="action" class="row-2">
      {#if room !== GENERAL}
        {#if getMembershipRoomsByUrl(url, $userMembership).includes(room)}
          <Button class="btn btn-neutral btn-sm" on:click={() => removeRoomMembership(url, room)}>
            <Icon icon="arrows-a-logout-2" />
            Leave Room
          </Button>
        {:else}
          <Button class="btn btn-neutral btn-sm" on:click={() => addRoomMembership(url, room)}>
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
    {#each $elements as { type, id, value, showPubkey } (id)}
      {#if type === "date"}
        <Divider>{value}</Divider>
      {:else}
        <div in:slide class:-mt-4={!showPubkey}>
          <ChannelMessage {url} {room} {replyTo} event={assertEvent(value)} {showPubkey} />
        </div>
      {/if}
    {/each}
    <p class="flex h-10 items-center justify-center py-20">
      <Spinner {loading}>
        {#if loading}
          Looking for messages...
        {:else}
          End of message history
        {/if}
      </Spinner>
    </p>
  </div>
  <ChannelCompose bind:editor {content} {onSubmit} />
</div>
