<script lang="ts">
  import {page} from "$app/stores"
  import {sortBy, last} from '@welshman/lib'
  import type {TrustedEvent} from '@welshman/util'
  import {formatTimestampAsDate} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import ThreadCard from "@app/components/ThreadCard.svelte"
  import ThreadCreate from "@app/components/ThreadCreate.svelte"
  import {pushModal} from "@app/modal"
  import {threadsByUrl, decodeNRelay} from "@app/state"

  const url = decodeNRelay($page.params.nrelay)

  const createThread = () => pushModal(ThreadCreate, {url})

  let loading = true

  $: threads = sortBy(thread => -thread.root.created_at, $threadsByUrl.get(url) || [])

  setTimeout(() => {
    loading = false
  }, 3000)
</script>

<div class="relative flex h-screen flex-col">
  <div class="relative z-feature mx-2 rounded-xl pt-4">
    <div
      class="flex min-h-12 items-center justify-between gap-4 rounded-xl bg-base-100 px-4 shadow-xl">
      <div class="flex items-center gap-2">
        <Icon icon="notes-minimalistic" />
        <strong>Threads</strong>
      </div>
    </div>
  </div>
  <div class="flex flex-grow flex-col overflow-auto p-2 gap-2">
    {#each threads as {root, replies} (root.id)}
      <ThreadCard {root} {replies} />
    {/each}
    <p class="flex h-10 items-center justify-center py-20">
      <Spinner {loading}>
        {#if loading}
          Looking for threads...
        {:else if threads.length === 0}
          No threads found.
        {/if}
      </Spinner>
    </p>
  </div>
  <Button class="fixed bottom-4 right-4 tooltip tooltip-left p-1" data-tip="Create an Event" on:click={createThread}>
    <div class="w-12 h-12 flex items-center justify-center btn btn-primary btn-circle">
      <Icon icon="add-square" />
    </div>
  </Button>
</div>
