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

  interface Props {
    thunk: Thunk | MergedThunk
    class?: string
  }

  let {thunk, ...restProps}: Props = $props()

  const {Pending, Failure, Timeout} = PublishStatus

  const abort = () => thunk.controller.abort()

  const retry = () => {
    thunk = (thunk as any).thunks
      ? mergeThunks((thunk as MergedThunk).thunks.map(t => publishThunk(t.request)))
      : publishThunk((thunk as Thunk).request)
  }

  const status = $derived(throttled(300, thunk.status))
  const ps = $derived(Object.values($status))
  const canCancel = $derived(ps.length === 0 && $userSettingValues.send_delay > 0)
  const isFailure = $derived(!canCancel && ps.every(s => [Failure, Timeout].includes(s.status)))
  const failure = $derived(
    Object.entries($status).find(([url, s]) => [Failure, Timeout].includes(s.status)),
  )

  let isPending = $state(Object.values(get(thunk.status)).some(s => s.status == Pending))

  // Delay updating isPending so users can see that the message is sent
  $effect(() => {
    isPending = isPending || ps.some(s => s.status === Pending)

    if (!ps.some(s => s.status === Pending)) {
      setTimeout(() => {
        isPending = false
      }, 2000)
    }
  })
</script>

{#if isFailure && failure}
  {@const [url, {message, status}] = failure}
  <div class="flex justify-end px-1 text-xs {restProps.class}">
    <Tippy
      class="flex items-center {restProps.class}"
      component={ThunkStatusDetail}
      props={{url, message, status, retry}}
      params={{interactive: true}}>
      {#snippet children()}
        <span class="flex cursor-pointer items-center gap-1 text-error">
          <Icon icon="danger" size={3} />
          <span>Failed to send!</span>
        </span>
      {/snippet}
    </Tippy>
  </div>
{:else if canCancel || isPending}
  <div class="flex justify-end px-1 text-xs {restProps.class}">
    <span class="flex items-center gap-1 {restProps.class}">
      <span class="loading loading-spinner mx-1 h-3 w-3 translate-y-px"></span>
      <span class="opacity-50">Sending...</span>
      {#if canCancel}
        <Button class="link" onclick={abort}>Cancel</Button>
      {/if}
    </span>
  </div>
{/if}
