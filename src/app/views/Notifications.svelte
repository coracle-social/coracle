<script lang="ts">
  import {find} from "ramda"
  import {onMount} from "svelte"
  import type {TrustedEvent} from "@welshman/util"
  import {createScroller, formatTimestampAsDate} from "src/util/misc"
  import {noteKinds, reactionKinds} from "src/util/nostr"
  import Tabs from "src/partials/Tabs.svelte"
  import Content from "src/partials/Content.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Note from "src/app/shared/Note.svelte"
  import GroupAlert from "src/app/shared/GroupAlert.svelte"
  import GroupRequest from "src/app/shared/GroupRequest.svelte"
  import OnboardingTasks from "src/app/shared/OnboardingTasks.svelte"
  import NotificationReactions from "src/app/views/NotificationReactions.svelte"
  import NotificationMention from "src/app/views/NotificationMention.svelte"
  import NotificationReplies from "src/app/views/NotificationReplies.svelte"
  import {router} from "src/app/util/router"
  import {
    pubkey,
    session,
    settings,
    markAsSeen,
    notifications,
    groupNotifications,
    createNotificationGroups,
    loadNotifications,
    loadGroupMessages,
    unreadNotifications,
    unreadGroupNotifications,
  } from "src/engine"

  const allTabs = ["Mentions & Replies", "Reactions", "Groups"]

  const setActiveTab = tab => router.at("notifications").at(tab).push()

  const loadMore = async () => {
    limit += 4
  }

  const getLineText = i => {
    const cur = tabNotifications[i]
    const prev = tabNotifications[i - 1]

    if (!prev || formatTimestampAsDate(prev.timestamp) !== formatTimestampAsDate(cur.timestamp)) {
      return formatTimestampAsDate(cur.timestamp)
    }
  }

  const getTabKinds = tab => (tab === allTabs[0] ? noteKinds : reactionKinds.concat(9734))

  export let activeTab = allTabs[0]

  let limit = 4
  let innerWidth = 0
  let element = null
  let tabNotifications = []
  let unreadMainNotifications = []
  let unreadReactionNotifications = []

  $: {
    const groupedNotifications = createNotificationGroups(
      $notifications,
      getTabKinds(activeTab),
    ).slice(0, limit)

    tabNotifications =
      activeTab === allTabs[0]
        ? groupedNotifications.filter(
            n => !n.event || find((e: TrustedEvent) => noteKinds.includes(e.kind), n.interactions),
          )
        : groupedNotifications.filter(n =>
            find((e: TrustedEvent) => reactionKinds.includes(e.kind), n.interactions),
          )

    const unreadMainKinds = getTabKinds(allTabs[0])
    const unreadReactionKinds = getTabKinds(allTabs[1])

    unreadMainNotifications = $unreadNotifications.filter(e => unreadMainKinds.includes(e.kind))
    unreadReactionNotifications = $unreadNotifications.filter(e =>
      unreadReactionKinds.includes(e.kind),
    )
  }

  $: displayTabs =
    innerWidth <= 640 || !$settings.enable_reactions ? [allTabs[0], allTabs[2]] : allTabs

  document.title = "Notifications"

  onMount(() => {
    loadGroupMessages()
    loadNotifications()

    const unsubUnreadNotifications = unreadNotifications.subscribe(events => {
      if (activeTab !== "Groups") {
        markAsSeen(events)
      }
    })

    const unsubUnreadGroupNotifications = unreadGroupNotifications.subscribe(events => {
      if (activeTab === "Groups") {
        markAsSeen(events)
      }
    })

    const scroller = createScroller(loadMore, {element})

    return () => {
      unsubUnreadNotifications()
      unsubUnreadGroupNotifications()
      scroller.stop()
    }
  })
</script>

<svelte:window bind:innerWidth />

<Tabs tabs={displayTabs} {activeTab} {setActiveTab}>
  <div slot="tab" let:tab class="flex gap-2">
    <div>{tab}</div>
    {#if tab === allTabs[0] && unreadMainNotifications.length > 0}
      <div class="h-6 rounded-full bg-neutral-700 px-2">
        {unreadMainNotifications.length}
      </div>
    {:else if tab === allTabs[1] && unreadReactionNotifications.length > 0}
      <div class="h-6 rounded-full bg-neutral-700 px-2">
        {unreadReactionNotifications.length}
      </div>
    {:else if tab === allTabs[2] && $unreadGroupNotifications.length > 0}
      <div class="h-6 rounded-full bg-neutral-700 px-2">
        {$unreadGroupNotifications.length}
      </div>
    {/if}
  </div>
</Tabs>

{#if $session?.onboarding_tasks_completed}
  <OnboardingTasks />
{/if}

<FlexColumn bind:element>
  {#if allTabs.slice(0, 2).includes(activeTab)}
    {#each tabNotifications as notification, i (notification.key)}
      {@const lineText = getLineText(i)}
      {#if lineText}
        <div class="flex items-center gap-4">
          <small class="whitespace-nowrap text-neutral-100">{lineText}</small>
          <div class="h-px w-full bg-neutral-600" />
        </div>
      {/if}
      {#if notification.event?.pubkey !== $pubkey}
        <NotificationMention {notification} />
      {:else if activeTab === allTabs[0]}
        <NotificationReplies {notification} />
      {:else}
        <NotificationReactions {notification} />
      {/if}
    {:else}
      <Content size="lg" class="text-center">No notifications found - check back later!</Content>
    {/each}
  {:else}
    {#each $groupNotifications.slice(0, limit) as notification, i (notification.id)}
      {#if notification.t === "alert"}
        <GroupAlert address={notification.group} alert={notification} />
      {:else if notification.t === "request"}
        <GroupRequest showGroup address={notification.group} request={notification} />
      {:else}
        <Note showGroup note={notification} />
      {/if}
    {:else}
      <Content size="lg" class="text-center">No notifications found - check back later!</Content>
    {/each}
  {/if}
</FlexColumn>
