<script lang="ts">
  import {filter, whereEq, complement, pluck, prop} from "ramda"
  import {toTitle, seconds, batch} from "hurdak"
  import {now} from "src/util/misc"
  import {navigate} from "svelte-routing"
  import Tabs from "src/partials/Tabs.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Content from "src/partials/Content.svelte"
  import MessagesListItem from "src/app/views/MessagesListItem.svelte"
  import {
    session,
    channels,
    load,
    loadPubkeys,
    hasNewNip04Messages,
    getUserRelayUrls,
    sortChannels,
    nip04MarkAllRead,
  } from "src/engine2"

  export let activeTab = "conversations"

  const since = now() - seconds(90, "day")
  const nip04Channels = channels.derived(filter(whereEq({type: "nip04"})))
  const accepted = nip04Channels.derived(filter(prop("last_sent")))
  const requests = nip04Channels.derived(filter(complement(prop("last_sent"))))

  $: tabChannels = sortChannels(activeTab === "conversations" ? $accepted : $requests)

  const getDisplay = tab => ({
    title: toTitle(tab),
    badge: (tab === "conversations" ? $accepted : $requests).length,
  })

  load({
    relays: getUserRelayUrls("read"),
    filters: [
      {kinds: [4], authors: [$session.pubkey], since},
      {kinds: [4], "#p": [$session.pubkey], since},
    ],
    onEvent: batch(1000, events => {
      loadPubkeys(pluck("pubkey", events))
    }),
  })

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
