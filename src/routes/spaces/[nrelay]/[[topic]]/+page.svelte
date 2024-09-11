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
  import {sortBy, now} from "@welshman/lib"
  import type {TrustedEvent, Filter} from "@welshman/util"
  import {subscribe, formatTimestampAsDate} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ChatMessage from "@app/components/ChatMessage.svelte"
  import ChatCompose from "@app/components/ChatCompose.svelte"
  import {deriveChat, MESSAGE, REPLY} from "@app/state"

  const {url, topic} = $page.params
  const chat = deriveChat(url)

  const assertEvent = (e: any) => e as TrustedEvent

  let loading = true
  let elements: Element[] = []

  $: {
    elements = []

    let previousDate
    let previousPubkey

    for (const {event} of sortBy(m => m.event.created_at, $chat?.messages || [])) {
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

  onMount(() => {
    const since = now() - 30
    const kinds = [MESSAGE, REPLY]
    const filter = topic ? {kinds, since, "#t": [topic]} : ({kinds, since} as Filter)
    const sub = subscribe({filters: [filter], relays: [url]})

    return () => sub.close()
  })
</script>

<div class="relative flex h-screen flex-col">
  <div class="relative z-feature mx-2 rounded-xl pt-4">
    <div class="flex min-h-12 items-center gap-4 rounded-xl bg-base-100 px-4 shadow-xl">
      <div class="flex items-center gap-2">
        <Icon icon="hashtag" />
        <strong>General</strong>
      </div>
    </div>
  </div>
  <div class="-mt-2 flex flex-grow flex-col-reverse overflow-auto py-2">
    {#each elements as { type, id, value, showPubkey } (id)}
      {#if type === "date"}
        <div class="flex items-center gap-2 p-2 text-xs opacity-50">
          <div class="h-px flex-grow bg-base-content opacity-25" />
          <p>{value}</p>
          <div class="h-px flex-grow bg-base-content opacity-25" />
        </div>
      {:else}
        <ChatMessage event={assertEvent(value)} {showPubkey} />
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
  <ChatCompose {url} {topic} />
</div>
