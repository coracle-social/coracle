<script lang="ts">
  import {get} from "svelte/store"
  import {PublishStatus} from "@welshman/net"
  import {mergeThunks, publishThunk} from "@welshman/app"
  import type {Thunk, MergedThunk} from "@welshman/app"
  import {throttled} from "@welshman/store"
  import Icon from "@lib/components/Icon.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import Button from "@lib/components/Button.svelte"
  import ThunkStatusDetail from "@app/components/ThunkStatusDetail.svelte"
  import {userSettingValues} from "@app/state"

  export let thunk: Thunk | MergedThunk

  const {Pending, Failure, Timeout} = PublishStatus

  const abort = () => thunk.controller.abort()

  const retry = () => {
    thunk = (thunk as any).thunks
      ? mergeThunks((thunk as MergedThunk).thunks.map(t => publishThunk(t.request)))
      : publishThunk((thunk as Thunk).request)
  }

  let isPending = Object.values(get(thunk.status)).some(s => s.status == Pending)

  $: status = throttled(300, thunk.status)
  $: ps = Object.values($status)
  $: canCancel = ps.length === 0 && $userSettingValues.send_delay > 0
  $: isFailure = !canCancel && ps.every(s => [Failure, Timeout].includes(s.status))
  $: failure = Object.entries($status).find(([url, s]) => [Failure, Timeout].includes(s.status))

  // Delay updating isPending so users can see that the message is sent
  $: {
    isPending = isPending || ps.some(s => s.status === Pending)

    if (!ps.some(s => s.status === Pending)) {
      setTimeout(() => {
        isPending = false
      }, 2000)
    }
  }
</script>

{#if isFailure && failure}
  {@const [url, {message, status}] = failure}
  <div class="flex justify-end px-1 text-xs {$$props.class}">
    <Tippy
      class="flex items-center {$$props.class}"
      component={ThunkStatusDetail}
      props={{url, message, status, retry}}
      params={{interactive: true}}>
      <span class="flex cursor-pointer items-center gap-1 text-error">
        <Icon icon="danger" size={3} />
        <span>Failed to send!</span>
      </span>
    </Tippy>
  </div>
{:else if canCancel || isPending}
  <div class="flex justify-end px-1 text-xs {$$props.class}">
    <span class="flex items-center gap-1 {$$props.class}">
      <span class="loading loading-spinner mx-1 h-3 w-3 translate-y-px" />
      <span class="opacity-50">Sending...</span>
      {#if canCancel}
        <Button class="link" on:click={abort}>Cancel</Button>
      {/if}
    </span>
  </div>
{/if}
