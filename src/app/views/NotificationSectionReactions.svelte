<script lang="ts">
  import {onMount} from "svelte"
  import {groupBy, ago, int, DAY} from "@welshman/lib"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import NotificationItem from "src/app/shared/NotificationItem.svelte"
  import {reactionNotifications, setChecked} from "src/engine"
  import NoteInteractions from "../shared/NoteInteractions.svelte"
  import NoteReactions from "../shared/NoteReactions.svelte"

  export let limit

  const interval = int(DAY)

  $: notifications = Array.from(
    groupBy(e => Math.round(ago(e.created_at) / interval), $reactionNotifications).entries(),
  ).slice(0, limit)

  onMount(() => {
    setChecked("reactions/*")

    return () => {
      setChecked("reactions/*")
    }
  })
</script>

<FlexColumn>
  {#each notifications as [seconds, events], i (seconds)}
    <NotificationItem depth={0} {notifications} {interval} {events} {i} let:event let:context>
      <NoteReactions {context} {event} />
    </NotificationItem>
  {:else}
    <p class="py-12 text-center">No notifications found - check back later!</p>
  {/each}
</FlexColumn>
