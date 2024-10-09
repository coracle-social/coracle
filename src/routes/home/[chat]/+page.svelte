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
  import {ctx, uniq, sortBy, remove} from "@welshman/lib"
  import type {TrustedEvent, EventContent} from "@welshman/util"
  import {createEvent, DIRECT_MESSAGE} from "@welshman/util"
  import {Nip59} from "@welshman/signer"
  import {
    pubkey,
    signer,
    formatTimestampAsDate,
    tagPubkey,
    makeThunk,
    publishThunk,
  } from "@welshman/app"
  import {fly} from "@lib/transition"
  import Spinner from "@lib/components/Spinner.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import Name from "@app/components/Name.svelte"
  import ProfileCircle from "@app/components/ProfileCircle.svelte"
  import ProfileCircles from "@app/components/ProfileCircles.svelte"
  import ChatMessage from "@app/components/ChatMessage.svelte"
  import ChatCompose from "@app/components/ChannelCompose.svelte"
  import {deriveChat, splitChatId} from "@app/state"
  import {sendWrapped} from "@app/commands"

  const id = $page.params.chat === 'notes' ? $pubkey! : $page.params.chat
  const chat = deriveChat(id)
  const pubkeys = splitChatId(id)
  const others = remove($pubkey, pubkeys)

  const assertEvent = (e: any) => e as TrustedEvent

  const onSubmit = async ({content, ...params}: EventContent) => {
    const tags = [...params.tags, ...pubkeys.map(pubkey => tagPubkey(pubkey))]
    const template = createEvent(DIRECT_MESSAGE, {content, tags})

    await sendWrapped({template, pubkeys})
  }

  let loading = true
  let elements: Element[] = []

  $: {
    elements = []

    let previousDate
    let previousPubkey

    for (const event of sortBy(e => e.created_at, $chat?.messages || [])) {
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
  {#if others.length > 0}
    <div class="relative z-feature mx-2 rounded-xl pt-4">
      <div
        class="flex min-h-12 items-center justify-between gap-4 rounded-xl bg-base-100 px-4 shadow-xl">
        <div class="flex items-center gap-2">
          {#if others.length === 1}
            <ProfileCircle pubkey={others[0]} size={5} />
            <Name pubkey={others[0]} />
          {:else}
            <ProfileCircles pubkeys={others} size={5} />
            <p class="overflow-hidden text-ellipsis whitespace-nowrap">
              <Name pubkey={others[0]} />
              and {others.length - 1}
              {others.length > 2 ? "others" : "other"}
            </p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  <div class="-mt-2 flex flex-grow flex-col-reverse overflow-auto py-2">
    {#each elements as { type, id, value, showPubkey } (id)}
      {#if type === "date"}
        <Divider>{value}</Divider>
      {:else}
        <div in:fly>
          <ChatMessage event={assertEvent(value)} {pubkeys} {showPubkey} />
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
  <ChatCompose {onSubmit} />
</div>
