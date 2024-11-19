<script lang="ts" context="module">
  type Element = {
    id: string
    type: "date" | "note"
    value: string | TrustedEvent
    showPubkey: boolean
  }
</script>

<script lang="ts">
  import {nip19} from "nostr-tools"
  import {onMount, onDestroy} from "svelte"
  import type {Readable} from "svelte/store"
  import type {Editor} from "svelte-tiptap"
  import {page} from "$app/stores"
  import {sortBy, append, now, ctx} from "@welshman/lib"
  import type {TrustedEvent, EventContent} from "@welshman/util"
  import {createEvent, DELETE} from "@welshman/util"
  import {formatTimestampAsDate, publishThunk} from "@welshman/app"
  import {slide} from "@lib/transition"
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
    makeChannelId,
    deriveChannel,
    GENERAL,
    tagRoom,
    MESSAGE,
    COMMENT,
    getMembershipRoomsByUrl,
  } from "@app/state"
  import {setChecked} from "@app/notifications"
  import {addRoomMembership, removeRoomMembership, subscribePersistent} from "@app/commands"
  import {popKey} from "@app/implicit"

  const {room = GENERAL} = $page.params
  const content = popKey<string>("content") || ""
  const url = decodeRelay($page.params.relay)
  const channel = deriveChannel(makeChannelId(url, room))

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
      event: createEvent(MESSAGE, {content, tags: append(tagRoom(room, url), tags)}),
      delay: $userSettingValues.send_delay,
    })

  let loading = true
  let editor: Readable<Editor>
  let elements: Element[] = []

  $: {
    elements = []

    let previousDate
    let previousPubkey

    for (const {event} of sortBy(m => m.event.created_at, $channel?.messages || [])) {
      if (event.kind === COMMENT) {
        continue
      }

      const {id, pubkey, created_at} = event
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
    }

    elements.reverse()
  }

  onMount(() => {
    pullConservatively({
      relays: [url],
      filters: [{kinds: [MESSAGE, DELETE], "#~": [room]}],
    })

    const unsub = subscribePersistent({
      relays: [url],
      filters: [{kinds: [MESSAGE, COMMENT], "#~": [room], since: now()}],
    })

    return () => {
      unsub()
    }
  })

  onDestroy(() => {
    setChecked($page.url.pathname)
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
    <strong slot="title">{room}</strong>
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
  <div class="-mt-2 flex flex-grow flex-col-reverse overflow-auto py-2">
    {#each elements as { type, id, value, showPubkey } (id)}
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
