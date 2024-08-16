<script lang="ts">
  import {sortBy} from "@welshman/lib"
  import type {CustomEvent} from "@welshman/util"
  import {page} from "$app/stores"
  import {formatTimestampAsDate} from "@lib/util"
  import Spinner from "@lib/components/Spinner.svelte"
  import GroupNote from "@app/components/GroupNote.svelte"
  import {deriveGroupConversation} from "@app/state"

  $: conversation = deriveGroupConversation($page.params.nom)

  const assertEvent = (e: any) => e as CustomEvent

  type Element = {
    id: string
    type: "date" | "note"
    value: string | CustomEvent
    showPubkey: boolean
  }

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

<div class="flex h-screen flex-col">
  <div class="min-h-24 bg-base-100 shadow-xl"></div>
  <div class="flex flex-grow flex-col-reverse overflow-auto">
    {#each elements as { type, id, value, showPubkey } (id)}
      {#if type === "date"}
        <div class="flex items-center gap-2 py-2 text-xs opacity-50">
          <div class="h-px flex-grow bg-base-content" />
          <p>{value}</p>
          <div class="h-px flex-grow bg-base-content" />
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
  <div class="shadow-top-xl min-h-32 bg-base-100"></div>
</div>
