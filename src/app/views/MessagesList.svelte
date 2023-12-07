<script lang="ts">
  import {filter} from "ramda"
  import {toTitle} from "hurdak"
  import Tabs from "src/partials/Tabs.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Content from "src/partials/Content.svelte"
  import MessagesListItem from "src/app/views/MessagesListItem.svelte"
  import type {Channel} from "src/engine"
  import {
    nip04Channels,
    hasNewNip04Messages,
    sortChannels,
    nip04MarkAllRead,
    loadAllNip04Messages,
  } from "src/engine"
  import {router} from "src/app/router"

  const activeTab =
    window.location.pathname.slice(1) === "conversations" ? "conversations" : "requests"
  const accepted = nip04Channels.derived(filter((c: Channel) => Boolean(c.last_sent)))
  const requests = nip04Channels.derived(filter((c: Channel) => !c.last_sent))
  const setActiveTab = tab => {
    const path = tab === "requests" ? "conversations/requests" : "conversations"

    router.at(path).push()
  }

  $: tabChannels = sortChannels(activeTab === "conversations" ? $accepted : $requests)

  loadAllNip04Messages()

  document.title = "Direct Messages"
</script>

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
    <Popover triggerType="mouseenter" class="absolute right-7 top-7 hidden sm:block">
      <div slot="trigger">
        <i
          class="fa fa-bell cursor-pointer"
          class:text-mid={!$hasNewNip04Messages}
          on:click={nip04MarkAllRead} />
      </div>
      <div slot="tooltip">Mark all as read</div>
    </Popover>
  {/if}
</div>

{#each tabChannels as channel (channel.id)}
  <MessagesListItem {channel} />
{:else}
  <Content size="lg" class="text-center">
    No messages found - start a conversation by clicking the envelope button on someone's profile.
  </Content>
{/each}
