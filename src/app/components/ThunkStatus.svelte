<script lang="ts">
  import {PublishStatus} from "@welshman/net"
  import {mergeThunks, publishThunk} from "@welshman/app"
  import type {Thunk, MergedThunk} from "@welshman/app"
  import {throttled} from "@welshman/store"
  import Icon from "@lib/components/Icon.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import Button from "@lib/components/Button.svelte"
  import ThunkStatusDetail from "@app/components/ThunkStatusDetail.svelte"

  export let thunk: Thunk | MergedThunk

  const {Pending, Failure, Timeout} = PublishStatus

  const abort = () => thunk.controller.abort()

  const retry = () => {
    thunk = (thunk as any).thunks
      ? mergeThunks((thunk as MergedThunk).thunks.map(t => publishThunk(t.request)))
      : publishThunk((thunk as Thunk).request)
  }

  $: status = throttled(300, thunk.status)
  $: ps = Object.values($status)
  $: canCancel = ps.length === 0
  $: isFailure = !canCancel && ps.every(s => [Failure, Timeout].includes(s.status))
  $: isPending = !isFailure && ps.some(s => s.status === Pending)
  $: failure = Object.entries($status).find(([url, s]) => [Failure, Timeout].includes(s.status))
</script>

<div class="flex justify-end text-xs px-1">
  {#if canCancel || isPending}
    <span class="mt-2 flex items-center gap-1">
      <span class="loading loading-spinner mx-1 h-3 w-3 translate-y-px" />
      <span class="opacity-50">Sending...</span>
      {#if canCancel}
        <Button class="link" on:click={abort}>Cancel</Button>
      {/if}
    </span>
  {:else if isFailure && failure}
    {@const [url, {message, status}] = failure}
    <Tippy
      component={ThunkStatusDetail}
      props={{url, message, status, retry}}
      params={{interactive: true}}>
      <span class="tooltip mt-2 flex cursor-pointer items-center gap-1">
        <Icon icon="danger" size={3} />
        <span class="opacity-50">Failed to send!</span>
      </span>
    </Tippy>
  {/if}
</div>
