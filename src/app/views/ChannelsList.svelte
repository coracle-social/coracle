<script lang="ts">
  import {onMount} from "svelte"
  import {toTitle, Storage} from "hurdak"
  import {derived} from "svelte/store"
  import {signer} from "@welshman/app"
  import {slide} from "src/util/transition"
  import {createScroller} from "src/util/misc"
  import Tabs from "src/partials/Tabs.svelte"
  import Card from "src/partials/Card.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Content from "src/partials/Content.svelte"
  import ChannelsListItem from "src/app/views/ChannelsListItem.svelte"
  import {router} from "src/app/util/router"
  import {channels, hasNip44, hasNewMessages, markAllChannelsRead} from "src/engine"

  const activeTab = window.location.pathname.slice(1) === "channels" ? "conversations" : "requests"
  const accepted = derived(channels, $ch => $ch.filter(c => c.last_sent > 0))
  const requests = derived(channels, $ch =>
    $ch.filter(c => c.last_received > 0 && c.last_sent === 0),
  )
  const setActiveTab = tab => {
    const path = tab === "requests" ? "channels/requests" : "channels"

    router.at(path).push()
  }

  const loadMore = async () => {
    limit += 20
  }

  const hideAlert = () => {
    Storage.setJson("hide_nip04_alert", true)
    hideNip04Alert = true
  }

  $: tabChannels = activeTab === "conversations" ? $accepted : $requests

  let element
  let limit = 20
  let hideNip04Alert = Storage.getJson("hide_nip04_alert")

  onMount(() => {
    const scroller = createScroller(loadMore, {element, delay: 300})

    return () => {
      scroller.stop()
    }
  })

  document.title = "Direct Messages"
</script>

<FlexColumn bind:element>
  {#if $hasNip44 && !hideNip04Alert}
    <div class="-my-2">
      <div out:slide|local class="py-4">
        <Card class="relative">
          <FlexColumn>
            <p class="flex items-center gap-4 text-xl">
              <i class="fa fa-info-circle" /> You’re using a new version of private messages.
            </p>
            <p>
              Nostr messages are now more secure, but are still far from perfect. For truly private
              communication, consider using <Anchor external underline href="https://simplex.chat"
                >SimpleX</Anchor> instead.
            </p>
          </FlexColumn>
          <i class="fa fa-times absolute right-0 top-0 cursor-pointer p-2" on:click={hideAlert} />
        </Card>
      </div>
    </div>
  {/if}
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
