<script lang="ts">
  import {onMount} from "svelte"
  import {groupBy, ago, int, HOUR} from "@welshman/lib"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import NotificationItem from "src/app/shared/NotificationItem.svelte"
  import {mainNotifications, setChecked} from "src/engine"

  export let limit

  const interval = int(HOUR, 3)

  $: notifications = Array.from(
    groupBy(e => Math.round(ago(e.created_at) / interval), $mainNotifications).entries(),
  ).slice(0, limit)

  onMount(() => {
    setChecked("notes/*")

    return () => {
      setChecked("notes/*")
    }
  })
</script>

<FlexColumn>
  {#each notifications as [seconds, events], i (seconds)}
    <NotificationItem verb="replied" depth={1} {notifications} {interval} {events} {i} />
  {:else}
    <p class="py-12 text-center">No notifications found - check back later!</p>
  {/each}
</FlexColumn>
