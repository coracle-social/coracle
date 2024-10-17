<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import {PublishStatus} from "@welshman/net"
  import type {Thunk, MergedThunk} from "@welshman/app"
  import Icon from '@lib/components/Icon.svelte'
  import Button from '@lib/components/Button.svelte'

  export let thunk: Thunk | MergedThunk

  const {status} = thunk
  const {Pending, Success, Failure, Timeout} = PublishStatus

  const abort = () => thunk.controller.abort()

  $: ps = Object.values($status)
  $: canCancel = ps.length === 0
  $: isPending = ps.some(s => s.status === Pending)
  $: isSuccess = ps.some(s => s.status === Success)
  $: isFailure = !canCancel && ps.every(s => [Failure, Timeout].includes(s.status))
  $: failure = Object.entries($status).find(([url, s]) => [Failure, Timeout].includes(s.status))
</script>

{#if canCancel || isPending}
  <span class="flex gap-1 mt-2 items-center">
    <span class="loading loading-spinner mx-1 h-3 w-3 translate-y-px" />
    <span class="opacity-50">Sending...</span>
    {#if canCancel}
      <Button class="link" on:click={abort}>Cancel</Button>
    {/if}
  </span>
{:else if isFailure && failure}
  {@const [url, {message}] = failure}
  <span
    class="flex tooltip cursor-pointer gap-1 mt-2"
    data-tip="{message} ({displayRelayUrl(url)})">
    <Icon icon="danger" class="translate-y-px" size={3} />
    <span class="opacity-50">Failed to send!</span>
  </span>
{/if}
