<script lang="ts">
  import {sortBy} from "@welshman/lib"
  import {formatTimestampAsDate} from "src/util/misc"
  import type {Notification} from "src/engine"

  export let notifications: Notification[]
  export let limit: number

  const getDate = (i: number) => {
    const cur = notifications[i]
    const prev = notifications[i - 1]

    if (!prev || formatTimestampAsDate(prev.timestamp) !== formatTimestampAsDate(cur.timestamp)) {
      return formatTimestampAsDate(cur.timestamp)
    }
  }
</script>

{#each sortBy(n => -n.timestamp, notifications).slice(0, limit) as notification, i (notification.key)}
  {@const date = getDate(i)}
  {#if date}
    <div class="flex items-center gap-4">
      <small class="whitespace-nowrap text-neutral-100">{date}</small>
      <div class="h-px w-full bg-neutral-600" />
    </div>
  {/if}
  <slot name="notification" {notification} />
{:else}
  <p class="py-12 text-center">No notifications found - check back later!</p>
{/each}
