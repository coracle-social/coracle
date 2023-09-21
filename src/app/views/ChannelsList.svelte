<script lang="ts">
  import {complement, prop, filter} from "ramda"
  import {toTitle} from "hurdak"
  import {navigate} from "svelte-routing"
  import {modal} from "src/partials/state"
  import Tabs from "src/partials/Tabs.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Content from "src/partials/Content.svelte"
  import ForegroundButton from "src/partials/ForegroundButton.svelte"
  import ForegroundButtons from "src/partials/ForegroundButtons.svelte"
  import ChannelsListItem from "src/app/views/ChannelsListItem.svelte"
  import {
    nip24Channels,
    hasNewNip24Messages,
    sortChannels,
    nip24MarkAllRead,
    loadAllNip24Messages,
  } from "src/engine"

  export let activeTab = "conversations"

  const accepted = nip24Channels.derived(filter(prop("last_sent")))
  const requests = nip24Channels.derived(filter(complement(prop("last_sent"))))

  $: tabChannels = sortChannels(activeTab === "conversations" ? $accepted : $requests)

  const getDisplay = tab => ({
    title: toTitle(tab),
    badge: (tab === "conversations" ? $accepted : $requests).length,
  })

  const setActiveTab = tab => navigate(tab === "conversations" ? "/channels" : "/channels/requests")

  document.title = "Direct Messages"

  loadAllNip24Messages()
</script>

<div class="bg-gray-7">
  <Content>
    <p>
      You are using an experimental version of private messaging. If you're looking for old-style
      messages, click <Anchor theme="anchor" href="/conversations">here</Anchor>.
    </p>
  </Content>
</div>

<Content>
  <div class="relative">
    <Tabs tabs={["conversations", "requests"]} {activeTab} {setActiveTab} {getDisplay} />
    <Popover triggerType="mouseenter" class="absolute right-5 top-7 hidden sm:block">
      <div slot="trigger">
        <i
          class="fa fa-bell cursor-pointer"
          class:text-gray-5={!$hasNewNip24Messages}
          on:click={nip24MarkAllRead} />
      </div>
      <div slot="tooltip">Mark all as read</div>
    </Popover>
  </div>
  {#each tabChannels as channel (channel.id)}
    <ChannelsListItem {channel} />
  {:else}
    <Content size="lg" class="text-center">No messages found.</Content>
  {/each}
</Content>

<ForegroundButtons>
  <ForegroundButton on:click={() => modal.push({type: "channel/create"})}>
    <i class="fa fa-plus" />
  </ForegroundButton>
</ForegroundButtons>
