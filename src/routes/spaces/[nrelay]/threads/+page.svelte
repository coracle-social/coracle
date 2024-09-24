<script lang="ts">
  import {page} from "$app/stores"
  import {sortBy} from "@welshman/lib"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ThreadItem from "@app/components/ThreadItem.svelte"
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
  <div class="flex flex-grow flex-col gap-2 overflow-auto p-2">
    {#each threads as { root, replies } (root.id)}
      <ThreadItem {root} {replies} />
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
  <Button
    class="tooltip tooltip-left fixed bottom-4 right-4 p-1"
    data-tip="Create an Event"
    on:click={createThread}>
    <div class="btn btn-circle btn-primary flex h-12 w-12 items-center justify-center">
      <Icon icon="add-square" />
    </div>
  </Button>
</div>
