<script lang="ts">
  import {onMount} from "svelte"
  import {derived} from "svelte/store"
  import {max, pushToMapKey} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {getAncestorTagValues} from "@welshman/util"
  import {formatTimestampAsDate} from "src/util/misc"
  import NotificationList from "src/app/views/NotificationList.svelte"
  import NotificationReactions from "src/app/views/NotificationReactions.svelte"
  import {
    reactionNotifications,
    setChecked,
    unreadReactionNotifications,
  } from "src/engine/notifications"

  export let limit

  const notifications = derived(reactionNotifications, $events => {
    const eventsByKey = new Map<string, TrustedEvent[]>()

    for (const event of $events) {
      const [parentId] = getAncestorTagValues(event.tags).replies

      // Group and sort by day/event so we can cluster interactions with the same event
      const date = formatTimestampAsDate(event.created_at)
      const key = ["reaction", parentId, date].join(":")

      pushToMapKey(eventsByKey, key, event)
    }

    return Array.from(eventsByKey.entries()).map(([key, interactions]) => {
      const [type, root] = key.split(":")
      const timestamp = max(interactions.map(e => e.created_at))

      return {key, type, root, timestamp, interactions}
    })
  })

  onMount(() => {
    const tracked = new Set()
    setChecked(["reactions", "zaps"])

    const unsub = unreadReactionNotifications.subscribe(async events => {
      const untracked = events.filter(e => !tracked.has(e.id))

      if (untracked.length > 0) {
        for (const id of untracked) {
          tracked.add(id)
        }
      }
    })

    return () => {
      unsub()
      setChecked(["reactions", "zaps"])
    }
  })
</script>

<NotificationList notifications={$notifications} {limit}>
  <div slot="notification" let:notification>
    <NotificationReactions {notification} />
  </div>
</NotificationList>
