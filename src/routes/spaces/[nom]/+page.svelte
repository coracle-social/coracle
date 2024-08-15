<script lang="ts">
  import {sleep, sortBy} from '@welshman/lib'
  import type {CustomEvent} from '@welshman/util'
  import {page} from '$app/stores'
  import {fly} from '@lib/transition'
  import {formatTimestampAsDate} from '@lib/util'
  import Spinner from '@lib/components/Spinner.svelte'
  import Avatar from '@lib/components/Avatar.svelte'
  import GroupNote from '@app/components/GroupNote.svelte'
  import {deriveGroup, deriveGroupConversation} from '@app/state'

  const group = deriveGroup($page.params.nom)
  const conversation = deriveGroupConversation($page.params.nom)

  const assertEvent = (e: any) => e as CustomEvent

  type Element = {
    id: string
    type: 'date' | 'note',
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
      const {id, kind, pubkey, created_at} = event
      const date = formatTimestampAsDate(created_at)

      if (date !== previousDate) {
        elements.push({type: 'date', value: date, id: date, showPubkey: false})
      }

      elements.push({
        id,
        type: 'note',
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

<div class="h-screen flex flex-col">
  <div class="min-h-24 bg-base-100 shadow-xl">
  </div>
  <div class="flex-grow overflow-auto flex flex-col-reverse gap-2 p-2">
    {#each elements as {type, id, value, showPubkey} (id)}
      {#if type === "date"}
        <div class="flex gap-2 items-center text-xs opacity-50">
          <div class="h-px flex-grow bg-base-content" />
          <p>{value}</p>
          <div class="h-px flex-grow bg-base-content" />
        </div>
      {:else}
        <GroupNote event={assertEvent(value)} {showPubkey} />
      {/if}
    {/each}
    <p class="flex justify-center items-center py-20 h-10">
      <Spinner {loading}>
        {#if loading}
          Looking for messages...
        {:else}
          End of message history
        {/if}
      </Spinner>
    </p>
  </div>
  <div class="min-h-32 bg-base-100 shadow-top-xl">
  </div>
</div>

