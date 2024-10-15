<script lang="ts">
  import {onMount} from "svelte"
  import {createScroller} from "src/util/misc"
  import Tabs from "src/partials/Tabs.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import OnboardingTasks from "src/app/shared/OnboardingTasks.svelte"
  import NotificationSectionMain from "src/app/views/NotificationSectionMain.svelte"
  import NotificationSectionReactions from "src/app/views/NotificationSectionReactions.svelte"
  import NotificationSectionGroups from "src/app/views/NotificationSectionGroups.svelte"
  import {router} from "src/app/util/router"
  import {
    sessionWithMeta,
    userSettings,
    loadNotifications,
    loadCircleMessages,
    unreadMainNotifications,
    unreadReactionNotifications,
    unreadGroupNotifications,
  } from "src/engine"

  const allTabs = ["Mentions & Replies", "Reactions", "Groups"]

  const setActiveTab = tab => router.at("notifications").at(tab).push()

  const loadMore = async () => {
    limit += 4
  }

  export let activeTab = allTabs[0]

  let limit = 4
  let innerWidth = 0
  let element = null

  $: displayTabs =
    innerWidth <= 640 || !$userSettings.note_actions.includes("reactions")
      ? [allTabs[0], allTabs[2]]
      : allTabs

  document.title = "Notifications"

  onMount(() => {
    loadNotifications()
    loadCircleMessages()

    const scroller = createScroller(loadMore, {element})

    return () => {
      scroller.stop()
    }
  })
</script>

<svelte:window bind:innerWidth />

<Tabs tabs={displayTabs} {activeTab} {setActiveTab}>
  <div slot="tab" let:tab class="flex gap-2">
    <div>{tab}</div>
    {#if activeTab !== tab}
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
    {/if}
  </div>
</Tabs>

{#if $sessionWithMeta?.onboarding_tasks_completed}
  <OnboardingTasks />
{/if}

<div bind:this={element}>
  {#if activeTab === allTabs[0]}
    <NotificationSectionMain {limit} />
  {:else if activeTab === allTabs[1]}
    <NotificationSectionReactions {limit} />
  {:else if activeTab === allTabs[2]}
    <NotificationSectionGroups {limit} />
  {/if}
</div>
