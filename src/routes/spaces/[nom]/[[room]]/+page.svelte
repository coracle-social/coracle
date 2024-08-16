<script lang="ts" context="module">
  type Element = {
    id: string
    type: "date" | "note"
    value: string | CustomEvent
    showPubkey: boolean
  }
</script>

<script lang="ts">
  import {sortBy} from "@welshman/lib"
  import type {CustomEvent} from "@welshman/util"
  import {page} from "$app/stores"
  import {formatTimestampAsDate} from "@lib/util"
  import Icon from "@lib/components/Icon.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import GroupNote from "@app/components/GroupNote.svelte"
  import {deriveGroupConversation} from "@app/state"

  const {nom} = $page.params
  const conversation = deriveGroupConversation(nom)

  const assertEvent = (e: any) => e as CustomEvent

  let loading = true
  let elements: Element[] = []

  $: {
    elements = []

    let previousDate
    let previousPubkey

    for (const {event} of sortBy(m => m.event.created_at, $conversation?.messages || [])) {
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
  <div class="relative z-feature px-2 pt-4">
    <div class="flex min-h-12 items-center gap-4 rounded-xl bg-base-100 px-4 shadow-xl">
      <div class="flex items-center gap-2">
        <Icon icon="hashtag" />
        <strong>General</strong>
      </div>
    </div>
  </div>
  <div class="flex flex-grow flex-col-reverse overflow-auto">
    {#each elements as { type, id, value, showPubkey } (id)}
      {#if type === "date"}
        <div class="flex items-center gap-2 p-2 text-xs opacity-50">
          <div class="h-px flex-grow bg-base-content opacity-25" />
          <p>{value}</p>
          <div class="h-px flex-grow bg-base-content opacity-25" />
        </div>
      {:else}
        <GroupNote event={assertEvent(value)} {showPubkey} />
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
  <div class="relative z-feature border-t border-solid border-base-100 px-2 py-2">
    <div class="shadow-top-xl flex min-h-12 items-center gap-4 rounded-xl bg-base-100 px-4"></div>
  </div>
</div>
