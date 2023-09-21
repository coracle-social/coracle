<script lang="ts">
  import {find} from "ramda"
  import {onMount} from "svelte"
  import {fly} from "src/util/transition"
  import {navigate} from "svelte-routing"
  import {now, createScroller, formatTimestampAsDate} from "src/util/misc"
  import {noteKinds, reactionKinds} from "src/util/nostr"
  import Tabs from "src/partials/Tabs.svelte"
  import Content from "src/partials/Content.svelte"
  import NotificationReactions from "src/app/views/NotificationReactions.svelte"
  import NotificationMention from "src/app/views/NotificationMention.svelte"
  import NotificationReplies from "src/app/views/NotificationReplies.svelte"
  import type {Event} from "src/engine"
  import {
    notifications,
    groupNotifications,
    notificationsLastChecked,
    loadNotifications,
  } from "src/engine"

  const tabs = ["Mentions & Replies", "Reactions"]

  const throttledNotifications = notifications.throttle(300)

  const setActiveTab = tab => navigate(`/notifications/${tab}`)

  const getLineText = i => {
    const cur = tabNotifications[i]
    const prev = tabNotifications[i - 1]

    if (!prev || formatTimestampAsDate(prev.timestamp) !== formatTimestampAsDate(cur.timestamp)) {
      return formatTimestampAsDate(cur.timestamp)
    }
  }

  export let activeTab = tabs[0]

  let limit = 20

  $: groupedNotifications = groupNotifications($throttledNotifications).slice(0, limit)

  $: tabNotifications =
    activeTab === tabs[0]
      ? groupedNotifications.filter(
          n => !n.event || find((e: Event) => noteKinds.includes(e.kind), n.interactions)
        )
      : groupedNotifications.filter(n =>
          find((e: Event) => reactionKinds.includes(e.kind), n.interactions)
        )

  document.title = "Notifications"

  onMount(() => {
    loadNotifications()

    notificationsLastChecked.set(now())

    const scroller = createScroller(async () => {
      limit += 20
    })

    return () => {
      scroller.stop()
      notificationsLastChecked.set(now())
    }
  })
</script>

<div in:fly={{y: 20}}>
  <Content>
    <Tabs {tabs} {activeTab} {setActiveTab} />
    {#each tabNotifications as notification, i (notification.key)}
      {@const lineText = getLineText(i)}
      {#if lineText}
        <div class="flex items-center gap-4">
          <small class="whitespace-nowrap text-gray-1">{lineText}</small>
          <div class="h-px w-full bg-gray-6" />
        </div>
      {/if}
      {#if !notification.event}
        <NotificationMention {notification} />
      {:else if activeTab === tabs[0]}
        <NotificationReplies {notification} />
      {:else}
        <NotificationReactions {notification} />
      {/if}
    {:else}
      <Content size="lg" class="text-center">No notifications found - check back later!</Content>
    {/each}
  </Content>
</div>
