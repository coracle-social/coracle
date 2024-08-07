<script lang="ts">
  import {onMount} from "svelte"
  import {derived} from "svelte/store"
  import {flatten, partition, pushToKey} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {
    SEEN_CONTEXT,
    SEEN_GENERAL,
    REACTION,
    getContextTagValues,
    getAddressTags,
  } from "@welshman/util"
  import {createScroller, formatTimestampAsDate} from "src/util/misc"
  import {noteKinds, reactionKinds, repostKinds} from "src/util/nostr"
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
  import type {GroupRequest as GroupRequestType, GroupAlert as GroupAlertType} from "src/engine"
  import {
    pubkey,
    session,
    settings,
    markAsSeen,
    notifications,
    createNotificationGroups,
    loadNotifications,
    loadGroupMessages,
    events,
    unwrapRepost,
    groupRequests,
    groupAlerts,
    groupAdminKeys,
    isEventMuted,
    getUserCircles,
    repository,
    sortEventsDesc,
    isSeen,
    isGroupRequest,
    isGroupAlert,
    mainNotifications,
    reactionNotifications,
    unreadMainNotifications,
    unreadReactionNotifications,
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

  const groupRequestNotifications = derived(groupRequests, $groupRequests =>
    $groupRequests.filter(r => !r.resolved && !repository.deletes.has(r.group)),
  )

  const groupAlertNotifications = derived(
    [groupAlerts, groupAdminKeys],
    ([$groupAlerts, $groupAdminKeys]) => {
      const adminPubkeys = new Set($groupAdminKeys.map(k => k.pubkey))

      return $groupAlerts.filter(
        a => !adminPubkeys.has(a.pubkey) && !repository.deletes.has(a.group),
      )
    },
  )

  const groupEventNotifications = derived(
    [session, events, isEventMuted],
    ([$session, $events, $isEventMuted]) =>
      repository
        .query([{"#a": getUserCircles($session)}])
        .map(e => {
          // Unwrap reposts, add community tags so we know where stuff was posted to
          if (repostKinds.includes(e.kind)) {
            const contextTags = getAddressTags(e.tags)

            e = unwrapRepost(e)

            for (const tag of contextTags) {
              e.tags.push(tag)
            }
          }

          return e
        })
        .filter(
          e =>
            e &&
            !(
              !noteKinds.includes(e.kind) ||
              e.pubkey === $session.pubkey ||
              // Skip mentions since they're covered in normal notifications
              e.tags.find(t => t[0] === "p" && t[1] === $session.pubkey) ||
              $isEventMuted(e)
            ),
        ),
  )

  const groupNotifications = derived(
    [groupRequestNotifications, groupAlertNotifications, groupEventNotifications],
    ([$groupRequestNotifications, $groupAlertNotifications, $groupEventNotifications]) =>
      sortEventsDesc(
        flatten([$groupRequestNotifications, $groupAlertNotifications, $groupEventNotifications]),
      ) as (TrustedEvent | GroupRequestType | GroupAlertType)[],
  )

  const unreadGroupNotifications = derived(
    [isSeen, groupNotifications],
    ([$isSeen, $groupNotifications]) =>
      $groupNotifications.filter(e => !getContextTagValues(e.tags).some(a => $isSeen(a, e))),
  )

  export let activeTab = allTabs[0]

  let limit = 4
  let innerWidth = 0
  let element = null
  let tabNotifications = []

  $: {
    const groupedNotifications = createNotificationGroups(
      $notifications,
      activeTab === allTabs[0] ? noteKinds : reactionKinds.concat(9734),
    ).slice(0, limit)

    tabNotifications =
      activeTab === allTabs[0]
        ? groupedNotifications.filter(
            n => !n.event || n.interactions.find((e: TrustedEvent) => noteKinds.includes(e.kind)),
          )
        : groupedNotifications.filter(n =>
            n.interactions.find((e: TrustedEvent) => reactionKinds.includes(e.kind)),
          )
  }

  $: displayTabs =
    innerWidth <= 640 || !$settings.enable_reactions ? [allTabs[0], allTabs[2]] : allTabs

  document.title = "Notifications"

  onMount(() => {
    loadGroupMessages()
    loadNotifications()

    const unsubUnreadMainNotifications = unreadMainNotifications.subscribe(events => {
      if (activeTab === allTabs[0] && events.length > 0) {
        markAsSeen(SEEN_GENERAL, {mentions: $mainNotifications, replies: $mainNotifications})
      }
    })

    const unsubUnreadReactionNotifications = unreadReactionNotifications.subscribe(events => {
      if (activeTab === allTabs[1] && events.length > 0) {
        const [reactions, zaps] = partition(e => e.kind === REACTION, $reactionNotifications)

        markAsSeen(SEEN_GENERAL, {reactions, zaps})
      }
    })

    const unsubUnreadGroupNotifications = unreadGroupNotifications.subscribe(events => {
      if (activeTab === allTabs[2] && events.length > 0) {
        const eventsByContext = {}

        for (const event of $groupNotifications) {
          for (const a of getContextTagValues(event.tags)) {
            pushToKey(eventsByContext, a, event)
          }
        }

        markAsSeen(SEEN_CONTEXT, eventsByContext)
      }
    })

    const scroller = createScroller(loadMore, {element})

    return () => {
      unsubUnreadMainNotifications()
      unsubUnreadReactionNotifications()
      unsubUnreadGroupNotifications()
      scroller.stop()
    }
  })
</script>

<svelte:window bind:innerWidth />

<Tabs tabs={displayTabs} {activeTab} {setActiveTab}>
  <div slot="tab" let:tab class="flex gap-2">
    <div>{tab}</div>
    {#if tab === allTabs[0] && $unreadMainNotifications.length > 0}
      <div class="h-6 rounded-full bg-neutral-700 px-2">
        {$unreadMainNotifications.length}
      </div>
    {:else if tab === allTabs[1] && $unreadReactionNotifications.length > 0}
      <div class="h-6 rounded-full bg-neutral-700 px-2">
        {$unreadReactionNotifications.length}
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
      {#if isGroupAlert(notification)}
        <GroupAlert address={notification.group} alert={notification} />
      {:else if isGroupRequest(notification)}
        <GroupRequest showGroup address={notification.group} request={notification} />
      {:else}
        <Note showGroup note={notification} />
      {/if}
    {:else}
      <Content size="lg" class="text-center">No notifications found - check back later!</Content>
    {/each}
  {/if}
</FlexColumn>
