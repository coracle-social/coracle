<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import {PublishStatus} from "@welshman/net"
  import type {Thunk} from "@welshman/app"
  import Icon from '@lib/components/Icon.svelte'
  import Button from '@lib/components/Button.svelte'

  export let thunk: Thunk

  const {status} = thunk
  const {Pending, Success, Failure, Timeout} = PublishStatus

  const undo = () => thunk.controller.abort()

  $: ps = Object.values($status)
  $: canUndo = ps.length === 0
  $: isPending = ps.some(s => s.status === Pending)
  $: isSuccess = ps.some(s => s.status === Success)
  $: isFailure = !canUndo && ps.every(s => [Failure, Timeout].includes(s.status))
  $: failure = Object.entries($status).find(([url, s]) => [Failure, Timeout].includes(s.status))
</script>

{#if canUndo || isPending}
  <span class="flex gap-1">
    <span class="loading loading-spinner mx-1 h-3 w-3 translate-y-px" />
    <span class="opacity-50">Sending...</span>
    {#if canUndo}
      <Button class="link" on:click={undo}>Undo</Button>
    {/if}
  </span>
{:else if isFailure && failure}
  {@const [url, {message}] = failure}
  <span
    class="flex tooltip cursor-pointer gap-1"
    data-tip="{message} ({displayRelayUrl(url)})">
    <Icon icon="danger" class="translate-y-px" size={3} />
    <span class="opacity-50">Failed to send!</span>
  </span>
{/if}
