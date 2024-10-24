<script lang="ts" context="module">
  type Element = {
    id: string
    type: "date" | "note"
    value: string | TrustedEvent
    showPubkey: boolean
  }
</script>

<script lang="ts">
  import {onMount} from "svelte"
  import {page} from "$app/stores"
  import {writable} from "svelte/store"
  import {sortBy, fromPairs, now, assoc, append} from "@welshman/lib"
  import type {TrustedEvent, EventContent} from "@welshman/util"
  import {createEvent} from "@welshman/util"
  import {formatTimestampAsDate, subscribe, publishThunk} from "@welshman/app"
  import type {Thunk} from "@welshman/app"
  import {slide} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import MenuSpace from "@app/components/MenuSpace.svelte"
  import ChannelMessage from "@app/components/ChannelMessage.svelte"
  import ChannelCompose from "@app/components/ChannelCompose.svelte"
  import {
    userMembership,
    decodeRelay,
    makeChannelId,
    deriveChannel,
    GENERAL,
    tagRoom,
    MESSAGE,
    REPLY,
    getMembershipRoomsByUrl,
  } from "@app/state"
  import {addRoomMembership, removeRoomMembership} from "@app/commands"
  import {pushDrawer} from "@app/modal"

  const {room = GENERAL} = $page.params
  const {content = ""} = fromPairs(Array.from($page.url.searchParams))
  const url = decodeRelay($page.params.relay)
  const channel = deriveChannel(makeChannelId(url, room))
  const thunks = writable({} as Record<string, Thunk>)

  const openMenu = () => pushDrawer(MenuSpace, {url})

  const assertEvent = (e: any) => e as TrustedEvent

  const onSubmit = ({content, tags}: EventContent) => {
    const event = createEvent(MESSAGE, {content, tags: append(tagRoom(room, url), tags)})
    const thunk = publishThunk({event, relays: [url], delay: 2000})

    thunks.update(assoc(thunk.event.id, thunk))
  }

  let loading = true
  let elements: Element[] = []

  $: {
    elements = []

    let previousDate
    let previousPubkey

    for (const {event} of sortBy(m => m.event.created_at, $channel?.messages || [])) {
      if (event.kind === REPLY) {
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
    subscribe({filters: [{"#~": [room], since: now()}], relays: [url]})
  })

  setTimeout(() => {
    loading = false
  }, 3000)
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
      <Button on:click={openMenu} class="btn btn-neutral btn-sm md:hidden">
        <Icon icon="menu-dots" />
      </Button>
    </div>
  </PageBar>
  <div class="-mt-2 flex flex-grow flex-col-reverse overflow-auto py-2">
    {#each elements as { type, id, value, showPubkey } (id)}
      {#if type === "date"}
        <Divider>{value}</Divider>
      {:else}
        {@const event = assertEvent(value)}
        {@const thunk = $thunks[event.id]}
        <div in:slide>
          <ChannelMessage {url} {room} {event} {thunk} {showPubkey} />
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
  <ChannelCompose {content} {onSubmit} />
</div>
