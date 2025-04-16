<script lang="ts">
  import {nth} from "@welshman/lib"
  import {PublishStatus} from "@welshman/net"
  import {
    MergedThunk,
    publishThunk,
    isMergedThunk,
    thunkIsComplete,
    thunkHasStatus,
  } from "@welshman/app"
  import type {Thunk} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Tippy from "@lib/components/Tippy.svelte"
  import ThunkStatusDetail from "@app/components/ThunkStatusDetail.svelte"
  import {userSettingValues} from "@app/state"

  interface Props {
    thunk: Thunk | MergedThunk
    class?: string
  }

  let {thunk, ...restProps}: Props = $props()

  const abort = () => thunk.controller.abort()

  const retry = () => {
    thunk = isMergedThunk(thunk)
      ? new MergedThunk(thunk.thunks.map(t => publishThunk(t.options)))
      : publishThunk(thunk.options)
  }

  const statuses = $derived(Object.entries($thunk.status))
  const isSending = $derived(thunkHasStatus($thunk, PublishStatus.Sending))
  const canCancel = $derived(isSending && $userSettingValues.send_delay > 0)
  const failedUrls = $derived(
    statuses
      .filter(([_, status]) => [PublishStatus.Failure, PublishStatus.Timeout].includes(status))
      .map(nth(0)),
  )

  const showFailure = $derived(thunkIsComplete($thunk) && failedUrls.length > 0)

  let isPending = $state(thunkHasStatus($thunk, PublishStatus.Pending))

  const showPending = $derived(canCancel || isPending)

  // Delay updating isPending so users can see that the message is sent
  $effect(() => {
    isPending = isPending || thunkHasStatus($thunk, PublishStatus.Pending)

    if (!thunkHasStatus($thunk, PublishStatus.Pending)) {
      setTimeout(() => {
        isPending = false
      }, 2000)
    }
  })
</script>

{#if showFailure}
  {@const url = failedUrls[0]}
  {@const status = $thunk.status[url]}
  {@const message = $thunk.details[url]}
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
{:else if showPending}
  <div class="flex justify-end px-1 text-xs {restProps.class}">
    <span class="flex items-center gap-1 {restProps.class}">
      <span class="loading loading-spinner mx-1 h-3 w-3 translate-y-px"></span>
      <span class="opacity-50">Sending...</span>
      <button
        type="button"
        class="underline transition-all"
        class:link={canCancel}
        class:opacity-25={!canCancel}
        onclick={abort}>
        Cancel
      </button>
    </span>
  </div>
{/if}
