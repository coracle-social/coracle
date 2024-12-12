<script lang="ts">
  import {onMount} from "svelte"
  import {toTitle} from "hurdak"
  import {derived} from "svelte/store"
  import {signer} from "@welshman/app"
  import {createScroller} from "src/util/misc"
  import Tabs from "src/partials/Tabs.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Content from "src/partials/Content.svelte"
  import ChannelsListItem from "src/app/views/ChannelsListItem.svelte"
  import {router} from "src/app/util/router"
  import {channels, hasNewMessages, setChecked} from "src/engine"

  const activeTab = window.location.pathname.slice(1) === "channels" ? "conversations" : "requests"
  const setActiveTab = tab => {
    const path = tab === "requests" ? "channels/requests" : "channels"

    router.at(path).push()
  }

  const loadMore = async () => {
    limit += 20
  }

  $: tabChannels = activeTab === "conversations" ? $accepted : $requests
  $: accepted = derived(channels, $ch => $ch.filter(c => c.last_sent > 0))
  $: requests = derived(channels, $ch => $ch.filter(c => c.last_received > 0 && c.last_sent === 0))

  let element
  let limit = 20

  onMount(() => {
    const scroller = createScroller(loadMore, {element, delay: 300})

    return () => {
      scroller.stop()
    }
  })

  const markAllChannelsRead = () => setChecked($channels.map(c => c.id))

  document.title = "Direct Messages"
</script>

<FlexColumn bind:element>
  <div class="flex justify-between">
    <div class="flex items-center gap-2">
      <i class="fa fa-comments fa-lg" />
      <h2 class="staatliches text-2xl">Your conversations</h2>
    </div>
    <Anchor modal button accent href="/channels/create" disabled={!$signer}>
      <i class="fa-solid fa-plus" /> Create
    </Anchor>
  </div>
  <div class="relative">
    <Tabs tabs={["conversations", "requests"]} {activeTab} {setActiveTab}>
      <div slot="tab" let:tab class="flex gap-2">
        <div>{toTitle(tab)}</div>
        <div class="h-6 rounded-full bg-neutral-700 px-2">
          {(tab === "conversations" ? $accepted : $requests).length}
        </div>
      </div>
      <Popover triggerType="mouseenter" class="-mt-4 px-4">
        <div slot="trigger">
          <i
            class="fa fa-bell cursor-pointer"
            class:text-neutral-600={!$hasNewMessages}
            on:click={markAllChannelsRead} />
        </div>
        <div slot="tooltip">Mark all as read</div>
      </Popover>
    </Tabs>
  </div>
  {#each tabChannels.slice(0, limit) as channel (channel.id)}
    <ChannelsListItem {channel} />
  {:else}
    <Content size="lg" class="text-center">No messages found.</Content>
  {/each}
</FlexColumn>
