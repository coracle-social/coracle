<script lang="ts" context="module">
  type Element = {
    id: string
    type: "date" | "note"
    value: string | TrustedEvent
    showPubkey: boolean
  }
</script>

<script lang="ts">
  import {page} from "$app/stores"
  import {sortBy, append} from "@welshman/lib"
  import type {TrustedEvent, EventContent} from "@welshman/util"
  import {createEvent} from "@welshman/util"
  import {formatTimestampAsDate, makeThunk, publishThunk} from "@welshman/app"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import ChannelMessage from "@app/components/ChannelMessage.svelte"
  import ChannelCompose from "@app/components/ChannelCompose.svelte"
  import {userMembership, decodeNRelay, makeChannelId, deriveChannel, GENERAL, tagRoom, MESSAGE} from "@app/state"
  import {addRoomMembership, removeRoomMembership} from "@app/commands"

  const {nrelay, room = GENERAL} = $page.params
  const url = decodeNRelay(nrelay)
  const channel = deriveChannel(makeChannelId(url, room))

  const assertEvent = (e: any) => e as TrustedEvent

  const onSubmit = ({content, tags}: EventContent) => {
    const event = createEvent(MESSAGE, {content, tags: append(tagRoom(room, url), tags)})

    publishThunk(makeThunk({event, relays: [url]}))
  }

  let loading = true
  let elements: Element[] = []

  $: membership = $userMembership?.roomsByUrl.get(url) || []

  $: {
    elements = []

    let previousDate
    let previousPubkey

    for (const {event} of sortBy(m => m.event.created_at, $channel?.messages || [])) {
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

  setTimeout(() => {
    loading = false
  }, 3000)
</script>

<div class="relative flex h-screen flex-col">
  <div class="relative z-feature mx-2 rounded-xl pt-4">
    <div
      class="flex min-h-12 items-center justify-between gap-4 rounded-xl bg-base-100 px-4 shadow-xl">
      <div class="flex items-center gap-2">
        <Icon icon="hashtag" />
        <strong>{room}</strong>
      </div>
      {#if room !== GENERAL}
        {#if membership.includes(room)}
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
    </div>
  </div>
  <div class="-mt-2 flex flex-grow flex-col-reverse overflow-auto py-2">
    {#each elements as { type, id, value, showPubkey } (id)}
      {#if type === "date"}
        <Divider>{value}</Divider>
      {:else}
        <div in:fly>
          <ChannelMessage {url} {room} event={assertEvent(value)} {showPubkey} />
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
  <div class="shadow-top-xl border-t border-solid border-base-100 bg-base-100">
    <ChannelCompose {onSubmit} />
  </div>
</div>
