<script lang="ts">
  import {filter} from "ramda"
  import {toTitle, Storage} from "hurdak"
  import {slide} from "src/util/transition"
  import Tabs from "src/partials/Tabs.svelte"
  import Card from "src/partials/Card.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Content from "src/partials/Content.svelte"
  import ChannelsListItem from "src/app/views/ChannelsListItem.svelte"
  import {router} from "src/app/router"
  import type {Channel} from "src/engine"
  import {
    nip44,
    channels,
    hasNewMessages,
    sortChannels,
    markAllChannelsRead,
    loadAllMessages,
  } from "src/engine"

  const activeTab = window.location.pathname.slice(1) === "channels" ? "conversations" : "requests"
  const accepted = channels.derived(filter((c: Channel) => Boolean(c.last_sent)))
  const requests = channels.derived(filter((c: Channel) => c.last_received && !c.last_sent))
  const setActiveTab = tab => {
    const path = tab === "requests" ? "channels/requests" : "channels"

    router.at(path).push()
  }

  $: tabChannels = sortChannels(activeTab === "conversations" ? $accepted : $requests)

  let hideNip04Alert = Storage.getJson("hide_nip04_alert")

  const hideAlert = () => {
    Storage.setJson("hide_nip04_alert", true)
    hideNip04Alert = true
  }

  document.title = "Direct Messages"

  loadAllMessages()
</script>

{#if $nip44.isEnabled() && !hideNip04Alert}
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
  <Anchor modal button accent href="/channels/create">
    <i class="fa-solid fa-plus" /> Create
  </Anchor>
</div>
<div class="relative">
  <Tabs tabs={["conversations", "requests"]} {activeTab} {setActiveTab}>
    <div slot="tab" let:tab class="flex gap-2">
      <div>{toTitle(tab)}</div>
      <div class="h-6 rounded-full bg-mid px-2">
        {(tab === "conversations" ? $accepted : $requests).length}
      </div>
    </div>
  </Tabs>
  <Popover triggerType="mouseenter" class="absolute right-5 top-1 hidden sm:block">
    <div slot="trigger">
      <i
        class="fa fa-bell cursor-pointer"
        class:text-mid={!$hasNewMessages}
        on:click={markAllChannelsRead} />
    </div>
    <div slot="tooltip">Mark all as read</div>
  </Popover>
</div>
{#each tabChannels as channel (channel.id)}
  <ChannelsListItem {channel} />
{:else}
  <Content size="lg" class="text-center">No messages found.</Content>
{/each}
