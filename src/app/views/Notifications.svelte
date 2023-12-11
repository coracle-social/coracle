<script lang="ts">
  import {find, assoc} from "ramda"
  import {onMount} from "svelte"
  import {now} from "paravel"
  import {createScroller, formatTimestampAsDate} from "src/util/misc"
  import {noteKinds, reactionKinds} from "src/util/nostr"
  import Tabs from "src/partials/Tabs.svelte"
  import Content from "src/partials/Content.svelte"
  import GroupAlert from "src/app/shared/GroupAlert.svelte"
  import GroupRequest from "src/app/shared/GroupRequest.svelte"
  import NotificationReactions from "src/app/views/NotificationReactions.svelte"
  import NotificationMention from "src/app/views/NotificationMention.svelte"
  import NotificationReplies from "src/app/views/NotificationReplies.svelte"
  import {router} from "src/app/router"
  import type {Event} from "src/engine"
  import {
    env,
    session,
    notifications,
    otherNotifications,
    groupNotifications,
    loadNotifications,
    updateCurrentSession,
  } from "src/engine"

  const tabs = ["Mentions & Replies", "Reactions"]

  if ($env.ENABLE_GROUPS) {
    tabs.push("Other")
  }

  const lastSynced = $session?.notifications_last_synced || 0

  const throttledNotifications = notifications.throttle(300)

  const setActiveTab = tab => router.at("notifications").at(tab).push()

  const getLineText = i => {
    const cur = tabNotifications[i]
    const prev = tabNotifications[i - 1]

    if (!prev || formatTimestampAsDate(prev.timestamp) !== formatTimestampAsDate(cur.timestamp)) {
      return formatTimestampAsDate(cur.timestamp)
    }
  }

  export let activeTab = tabs[0]

  let limit = 4

  $: tabKinds = activeTab === tabs[0] ? noteKinds : reactionKinds.concat(9734)

  $: groupedNotifications = groupNotifications($throttledNotifications, tabKinds).slice(0, limit)

  $: tabNotifications =
    activeTab === tabs[0]
      ? groupedNotifications.filter(
          n => !n.event || find((e: Event) => noteKinds.includes(e.kind), n.interactions)
        )
      : groupedNotifications.filter(n =>
          find((e: Event) => reactionKinds.includes(e.kind), n.interactions)
        )

  $: uncheckedOtherNotifications = $otherNotifications.filter(n => n.created_at > lastSynced)

  document.title = "Notifications"

  onMount(() => {
    loadNotifications()

    const unsub = throttledNotifications.subscribe(() => {
      updateCurrentSession(assoc("notifications_last_synced", now()))
    })

    const scroller = createScroller(async () => {
      limit += 4
    })

    return () => {
      unsub()
      scroller.stop()
    }
  })
</script>

<Tabs {tabs} {activeTab} {setActiveTab}>
  <div slot="tab" let:tab class="flex gap-2">
    <div>{tab}</div>
    {#if tab === tabs[2] && uncheckedOtherNotifications.length > 0}
      <div class="h-6 rounded-full bg-mid px-2">
        {uncheckedOtherNotifications.length}
      </div>
    {/if}
  </div>
</Tabs>

{#if tabs.slice(0, 2).includes(activeTab)}
  {#each tabNotifications as notification, i (notification.key)}
    {@const lineText = getLineText(i)}
    {#if lineText}
      <div class="flex items-center gap-4">
        <small class="whitespace-nowrap text-lightest">{lineText}</small>
        <div class="h-px w-full bg-mid" />
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
{:else}
  {#each $otherNotifications as notification, i (notification.id)}
    {#if notification.t === "alert"}
      <GroupAlert address={notification.group} alert={notification} />
    {:else if notification.t === "request"}
      <GroupRequest showGroup address={notification.group} request={notification} />
    {/if}
  {:else}
    <Content size="lg" class="text-center">No notifications found - check back later!</Content>
  {/each}
{/if}
