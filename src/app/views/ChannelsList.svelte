<script lang="ts">
  import {filter} from "ramda"
  import {toTitle} from "hurdak"
  import Tabs from "src/partials/Tabs.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Content from "src/partials/Content.svelte"
  import ForegroundButton from "src/partials/ForegroundButton.svelte"
  import ForegroundButtons from "src/partials/ForegroundButtons.svelte"
  import ChannelsListItem from "src/app/views/ChannelsListItem.svelte"
  import {router} from "src/app/router"
  import type {Channel} from "src/engine"
  import {
    nip24Channels,
    hasNewNip24Messages,
    sortChannels,
    nip24MarkAllRead,
    loadAllNip24Messages,
  } from "src/engine"

  const activeTab = window.location.pathname.slice(1) === "channels" ? "conversations" : "requests"
  const accepted = nip24Channels.derived(filter((c: Channel) => Boolean(c.last_sent)))
  const requests = nip24Channels.derived(filter((c: Channel) => !c.last_sent))
  const setActiveTab = tab => {
    const path = tab === "requests" ? "channels/requests" : "channels"

    router.at(path).push()
  }

  $: tabChannels = sortChannels(activeTab === "conversations" ? $accepted : $requests)

  const createChannel = () => router.at("channels/create").open()

  document.title = "Direct Messages"

  loadAllNip24Messages()
</script>

<div class="bg-cocoa">
  <Content>
    <p>
      You are using an experimental version of private messaging. If you're looking for old-style
      messages, click <Anchor underline href="/conversations">here</Anchor>.
    </p>
  </Content>
</div>

<Content>
  <div class="relative">
    <Tabs tabs={["conversations", "requests"]} {activeTab} {setActiveTab}>
      <div slot="tab" let:tab class="flex gap-2">
        <div>{toTitle(tab)}</div>
        <div class="h-6 rounded-full bg-mid px-2">
          {(tab === "conversations" ? $accepted : $requests).length}
        </div>
      </div>
    </Tabs>
    {#if activeTab === "conversations"}
      <Popover triggerType="mouseenter" class="absolute right-5 top-7 hidden sm:block">
        <div slot="trigger">
          <i
            class="fa fa-bell cursor-pointer"
            class:text-mid={!$hasNewNip24Messages}
            on:click={nip24MarkAllRead} />
        </div>
        <div slot="tooltip">Mark all as read</div>
      </Popover>
    {/if}
  </div>
  {#each tabChannels as channel (channel.id)}
    <ChannelsListItem {channel} />
  {:else}
    <Content size="lg" class="text-center">No messages found.</Content>
  {/each}
</Content>

<ForegroundButtons>
  <ForegroundButton on:click={createChannel}>
    <i class="fa fa-plus" />
  </ForegroundButton>
</ForegroundButtons>
