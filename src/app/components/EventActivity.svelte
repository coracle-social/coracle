<script lang="ts">
  import {onMount} from "svelte"
  import {max} from "@welshman/lib"
  import {COMMENT} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import type {TrustedEvent} from "@welshman/util"
  import {formatTimestampRelative, repository, load} from "@welshman/app"
  import {notifications} from "@app/notifications"
  import Icon from "@lib/components/Icon.svelte"

  const {url, path, event}: {url: string; path: string; event: TrustedEvent} = $props()

  const filters = [{kinds: [COMMENT], "#E": [event.id]}]
  const replies = deriveEvents(repository, {filters})
  const lastActive = $derived(max([...$replies, event].map(e => e.created_at)))

  onMount(() => {
    load({relays: [url], filters})
  })
</script>

<div class="flex-inline btn btn-neutral btn-xs gap-1 rounded-full">
  <Icon icon="reply" />
  <span>{$replies.length} {$replies.length === 1 ? "reply" : "replies"}</span>
</div>
<div class="btn btn-neutral btn-xs relative hidden rounded-full sm:flex">
  {#if $notifications.has(path)}
    <div class="h-2 w-2 rounded-full bg-primary"></div>
  {/if}
  Active {formatTimestampRelative(lastActive)}
</div>
