<script>
  import {sortBy, partition, prop} from "ramda"
  import {toTitle} from "hurdak/lib/hurdak"
  import {navigate} from "svelte-routing"
  import Tabs from "src/partials/Tabs.svelte"
  import Content from "src/partials/Content.svelte"
  import MessagesListItem from "src/app/views/MessagesListItem.svelte"
  import {chat} from "src/app/system"
  import {watch} from "src/util/loki"

  export let activeTab = "messages"

  const channels = watch(chat.channels, () => chat.channels.all({type: "private"}))

  const getChannels = tab =>
    sortBy(
      c => -Math.max(c.last_sent || 0, c.last_received || 0),
      tab === "messages" ? accepted : requests
    )

  const getDisplay = tab => ({
    title: toTitle(tab),
    badge: getChannels(tab).length,
  })

  $: [accepted, requests] = partition(prop("last_sent"), $channels)

  document.title = "Direct Messages"
</script>

<Content>
  <Tabs tabs={["messages", "requests"]} {activeTab} setActiveTab={navigate} {getDisplay} />
  {#each getChannels(activeTab) as channel (channel.id)}
    <MessagesListItem {channel} />
  {:else}
    <Content size="lg" class="text-center">
      No messages found - start a conversation by clicking the envelope button on someone's profile.
    </Content>
  {/each}
</Content>
