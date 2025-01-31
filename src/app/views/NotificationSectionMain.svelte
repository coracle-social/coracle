<script lang="ts">
  import {ago, groupBy, HOUR, int} from "@welshman/lib"
  import {onMount} from "svelte"
  import {mainNotifications, setChecked} from "src/engine"
  import NotificationItem from "src/app/shared/NotificationItem.svelte"
  import NoteInteractions from "src/app/shared/NoteInteractions.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"

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
    <NotificationItem depth={1} {notifications} {interval} {events} {i} let:event let:context>
      <NoteInteractions {context} {event} />
    </NotificationItem>
  {:else}
    <p class="py-12 text-center">No notifications found - check back later!</p>
  {/each}
</FlexColumn>
