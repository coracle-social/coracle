<script lang="ts">
  import {onMount} from "svelte"
  import {derived} from "svelte/store"
  import {max, ago, int, HOUR, pushToMapKey} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {getAncestorTagValues, SEEN_GENERAL} from "@welshman/util"
  import NotificationList from "src/app/views/NotificationList.svelte"
  import NotificationMention from "src/app/views/NotificationMention.svelte"
  import NotificationReplies from "src/app/views/NotificationReplies.svelte"
  import {mainNotifications, unreadMainNotifications, markAsSeen} from "src/engine"

  export let limit

  const notifications = derived(mainNotifications, $events => {
    const eventsByKey = new Map<string, TrustedEvent[]>()

    for (const event of $events) {
      const [parentId] = getAncestorTagValues(event.tags).replies

      // Group and sort by time/event so we can cluster interactions with the same event
      const date = Math.round(ago(event.created_at) / int(HOUR, 3)).toString()
      const key = [parentId ? "reply" : "mention", parentId || event.id, date].join(":")

      pushToMapKey(eventsByKey, key, event)
    }

    return Array.from(eventsByKey.entries()).map(([key, interactions]) => {
      const [type, root] = key.split(":")
      const timestamp = max(interactions.map(e => e.created_at))

      return {key, type, root, timestamp, interactions}
    })
  })

  let loading = false

  onMount(() => {
    const tracked = new Set()

    const unsub = unreadMainNotifications.subscribe(async events => {
      const untracked = events.filter(e => !tracked.has(e.id))

      if (!loading && untracked.length > 0) {
        for (const id of untracked) {
          tracked.add(id)
        }

        loading = true

        await markAsSeen(SEEN_GENERAL, {
          mentions: $mainNotifications,
          replies: $mainNotifications,
        })

        loading = false
      }
    })

    return unsub
  })
</script>

<NotificationList notifications={$notifications} {limit}>
  <div slot="notification" let:notification>
    {#if notification.type === "mention"}
      <NotificationMention {notification} />
    {:else}
      <NotificationReplies {notification} />
    {/if}
  </div>
</NotificationList>
