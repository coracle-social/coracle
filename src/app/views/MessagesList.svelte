<script lang="ts">
  import {filter, complement, prop} from "ramda"
  import {toTitle} from "hurdak"
  import {navigate} from "svelte-routing"
  import Tabs from "src/partials/Tabs.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Content from "src/partials/Content.svelte"
  import MessagesListItem from "src/app/views/MessagesListItem.svelte"
  import {
    nip04Channels,
    hasNewNip04Messages,
    sortChannels,
    nip04MarkAllRead,
    loadAllNip04Messages,
  } from "src/engine"

  export let activeTab = "conversations"

  const accepted = nip04Channels.derived(filter(prop("last_sent")))
  const requests = nip04Channels.derived(filter(complement(prop("last_sent"))))

  $: tabChannels = sortChannels(activeTab === "conversations" ? $accepted : $requests)

  const getDisplay = tab => ({
    title: toTitle(tab),
    badge: (tab === "conversations" ? $accepted : $requests).length,
  })

  loadAllNip04Messages()

  document.title = "Direct Messages"
</script>

<Content>
  <div class="relative">
    <Tabs tabs={["conversations", "requests"]} {activeTab} setActiveTab={navigate} {getDisplay} />
    <Popover triggerType="mouseenter" class="absolute right-7 top-7 hidden sm:block">
      <div slot="trigger">
        <i
          class="fa fa-bell cursor-pointer"
          class:text-gray-5={!$hasNewNip04Messages}
          on:click={nip04MarkAllRead} />
      </div>
      <div slot="tooltip">Mark all as read</div>
    </Popover>
  </div>
  {#each tabChannels as channel (channel.id)}
    <MessagesListItem {channel} />
  {:else}
    <Content size="lg" class="text-center">
      No messages found - start a conversation by clicking the envelope button on someone's profile.
    </Content>
  {/each}
</Content>
