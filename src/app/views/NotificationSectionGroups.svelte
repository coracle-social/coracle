<script lang="ts">
  import {onMount} from "svelte"
  import {pushToKey} from "@welshman/lib"
  import {getContextTagValues, SEEN_CONTEXT} from "@welshman/util"
  import Note from "src/app/shared/Note.svelte"
  import GroupAlert from "src/app/shared/GroupAlert.svelte"
  import GroupRequest from "src/app/shared/GroupRequest.svelte"
  import {
    groupNotifications,
    unreadGroupNotifications,
    isGroupAlert,
    isGroupRequest,
    markAsSeen,
  } from "src/engine"

  export let limit

  let loading = false

  onMount(() => {
    const tracked = new Set()

    const unsub = unreadGroupNotifications.subscribe(async $unreadGroupNotifications => {
      const untracked = $unreadGroupNotifications.filter(e => !tracked.has(e.id))

      if (untracked.length > 0) {
        for (const id of untracked) {
          tracked.add(id)
        }

        const eventsByContext = {}

        for (const event of $groupNotifications) {
          for (const a of getContextTagValues(event.tags)) {
            pushToKey(eventsByContext, a, event)
          }
        }

        loading = true

        await markAsSeen(SEEN_CONTEXT, eventsByContext)

        loading = false
      }
    })

    return unsub
  })
</script>

{#each $groupNotifications.slice(0, limit) as notification, i (notification.id)}
  <div class="mb-2">
    {#if isGroupAlert(notification)}
      <GroupAlert address={notification.group} alert={notification} />
    {:else if isGroupRequest(notification)}
      <GroupRequest showGroup address={notification.group} request={notification} />
    {:else}
      <Note showGroup note={notification} />
    {/if}
  </div>
{:else}
  <p class="py-12 text-center">No notifications found - check back later!</p>
{/each}
